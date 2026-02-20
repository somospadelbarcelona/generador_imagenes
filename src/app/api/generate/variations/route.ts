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
        lastError.message.includes('fetch failed') ||
        lastError.cause?.toString().includes('timeout');
      
      if (!isRetryableError || attempt === maxRetries - 1) throw lastError;
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, size = '1024x1024', count = 4 } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const batchId = `var_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const variationPrompts = [
      prompt,
      `${prompt}, alternative composition`,
      `${prompt}, different perspective`,
      `${prompt}, creative interpretation`
    ];

    const generatePromises = Array(count).fill(null).map(async (_, index) => {
      try {
        const variationPrompt = variationPrompts[index % variationPrompts.length];
        
        const response = await retryWithBackoff(
          async () => await zai.images.generations.create({
            prompt: `${variationPrompt}. High quality, detailed, professional`,
            size: size
          }),
          3,
          3000
        );

        const imageBase64 = response.data[0].base64;
        const imageUrl = `data:image/png;base64,${imageBase64}`;

        const savedImage = await db.generatedImage.create({
          data: {
            prompt: variationPrompt,
            imageUrl,
            type: 'variation',
            size,
            batchId,
            settings: JSON.stringify({ variationIndex: index })
          }
        });

        return { success: true, image: savedImage };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const results = await Promise.all(generatePromises);
    const successfulImages = results.filter(r => r.success).map(r => r.image);

    return NextResponse.json({
      success: true,
      images: successfulImages,
      total: count,
      successful: successfulImages.length
    });
  } catch (error) {
    console.error('Variation generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate variations' },
      { status: 500 }
    );
  }
}
