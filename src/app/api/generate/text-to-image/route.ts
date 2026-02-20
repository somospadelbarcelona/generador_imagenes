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
      
      // Check if it's a timeout or connection error
      const isRetryableError = 
        lastError.message.includes('timeout') ||
        lastError.message.includes('ETIMEDOUT') ||
        lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('fetch failed') ||
        lastError.cause?.toString().includes('timeout');
      
      if (!isRetryableError || attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Wait before retrying with exponential backoff
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
    const { prompt, negativePrompt, size = '1024x1024' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const supportedSizes = [
      '1024x1024',
      '768x1344',
      '864x1152',
      '1344x768',
      '1152x864',
      '1440x720',
      '720x1440'
    ];

    if (!supportedSizes.includes(size)) {
      return NextResponse.json(
        { error: `Unsupported size. Use one of: ${supportedSizes.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('Starting image generation for prompt:', prompt.substring(0, 50) + '...');

    const zai = await ZAI.create();

    // Use retry logic for image generation
    const response = await retryWithBackoff(
      async () => {
        return await zai.images.generations.create({
          prompt: `${prompt}, high quality, detailed, professional`,
          size: size
        });
      },
      3,  // max retries
      3000 // base delay
    );

    if (!response.data || !response.data[0] || !response.data[0].base64) {
      throw new Error('Invalid response from image generation API');
    }

    const imageBase64 = response.data[0].base64;
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    // Save to database
    const savedImage = await db.generatedImage.create({
      data: {
        prompt,
        imageUrl,
        type: 'text-to-image',
        size
      }
    });

    console.log('Image generated successfully:', savedImage.id);

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        imageUrl,
        prompt,
        type: 'text-to-image',
        size,
        isFavorite: false,
        createdAt: savedImage.createdAt
      }
    });
  } catch (error) {
    console.error('Text-to-image error:', error);
    
    // Provide user-friendly error message
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
