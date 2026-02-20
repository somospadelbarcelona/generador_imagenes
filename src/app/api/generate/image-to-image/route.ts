import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

// Retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const isRetryableError = 
        lastError.message.includes('timeout') ||
        lastError.message.includes('ETIMEDOUT') ||
        lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('fetch failed') ||
        lastError.cause?.toString().includes('timeout');
      
      if (!isRetryableError || attempt === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, sourceImage, size = '1024x1024' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!sourceImage) {
      return NextResponse.json(
        { error: 'Source image is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Analyze source image with retry
    const analysisResponse = await retryWithBackoff(
      async () => {
        return await zai.chat.completions.createVision({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Describe this image in detail, including its main subject, composition, colors, mood, and style. Be specific and thorough.'
                },
                {
                  type: 'image_url',
                  image_url: { url: sourceImage }
                }
              ]
            }
          ],
          thinking: { type: 'disabled' }
        });
      },
      3,
      2000
    );

    const imageDescription = analysisResponse.choices[0]?.message?.content || '';

    const enhancedPrompt = `Based on an original image described as: "${imageDescription}". Transform it according to: ${prompt}. Maintain the essence while applying the requested changes. High quality, detailed, professional.`;

    // Generate new image with retry
    const response = await retryWithBackoff(
      async () => {
        return await zai.images.generations.create({
          prompt: enhancedPrompt,
          size: size
        });
      },
      3,
      3000
    );

    const imageBase64 = response.data[0].base64;
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    const savedImage = await db.generatedImage.create({
      data: {
        prompt,
        imageUrl,
        type: 'image-to-image',
        size,
        sourceImage,
        settings: JSON.stringify({ originalDescription: imageDescription })
      }
    });

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        imageUrl,
        prompt,
        size,
        sourceImage,
        originalDescription: imageDescription,
        createdAt: savedImage.createdAt
      }
    });
  } catch (error) {
    console.error('Image-to-image error:', error);
    let errorMessage = 'Failed to generate image';
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.cause?.toString().includes('timeout')) {
        errorMessage = 'El servicio está tardando mucho. Por favor, intenta de nuevo.';
      } else {
        errorMessage = error.message;
      }
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
