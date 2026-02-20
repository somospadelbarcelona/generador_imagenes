import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

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
    const { 
      prompt, 
      negativePrompt = '',
      size = '1024x1024', 
      count = 4,
      styleId,
      collectionId,
      templateId
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (count < 1 || count > 10) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 10' },
        { status: 400 }
      );
    }

    console.log(`Starting batch generation: ${count} images`);

    const zai = await ZAI.create();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    let promptSuffix = '';
    if (styleId) {
      const style = await db.style.findUnique({ where: { id: styleId } });
      if (style) {
        promptSuffix = style.promptSuffix;
      }
    }

    let enhancedPrompt = `${prompt}${promptSuffix}`;
    if (negativePrompt) {
      enhancedPrompt += `. Avoid: ${negativePrompt}`;
    }
    enhancedPrompt += '. High quality, detailed, professional';

    const generatePromises = Array(count).fill(null).map(async (_, index) => {
      try {
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
            type: 'batch',
            size,
            batchId,
            settings: JSON.stringify({ batchIndex: index, totalInBatch: count })
          }
        });

        return { success: true, image: savedImage };
      } catch (error) {
        console.error(`Failed to generate image ${index + 1}:`, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const results = await Promise.all(generatePromises);
    const successfulImages = results.filter(r => r.success).map(r => r.image);
    const failedCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      batchId,
      images: successfulImages,
      total: count,
      successful: successfulImages.length,
      failed: failedCount
    });
  } catch (error) {
    console.error('Batch generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate images' },
      { status: 500 }
    );
  }
}
