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
    const { prompt, brandId, size = '1024x1024' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    const brand = await db.brand.findUnique({
      where: { id: brandId }
    });

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    const zai = await ZAI.create();

    let brandColors: string[] = [];
    try {
      brandColors = JSON.parse(brand.colors);
    } catch {
      brandColors = [];
    }

    let brandPrompt = prompt;
    
    if (brand.styleGuide) {
      brandPrompt += `. Style: ${brand.styleGuide}`;
    }
    
    if (brandColors.length > 0) {
      brandPrompt += `. Use brand colors: ${brandColors.join(', ')}`;
    }
    
    brandPrompt += '. On-brand, professional, consistent with brand identity, high quality.';

    let logoDescription = '';
    if (brand.logoUrl) {
      try {
        const logoAnalysis = await retryWithBackoff(
          async () => {
            return await zai.chat.completions.createVision({
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Describe this brand logo in terms of style, shapes, typography, and overall aesthetic. Be concise but specific.'
                    },
                    {
                      type: 'image_url',
                      image_url: { url: brand.logoUrl! }
                    }
                  ]
                }
              ],
              thinking: { type: 'disabled' }
            });
          },
          2,
          2000
        );
        logoDescription = logoAnalysis.choices[0]?.message?.content || '';
        
        if (logoDescription) {
          brandPrompt += ` Logo aesthetic reference: ${logoDescription}`;
        }
      } catch (error) {
        console.warn('Could not analyze logo, continuing without it:', error);
      }
    }

    const response = await retryWithBackoff(
      async () => {
        return await zai.images.generations.create({
          prompt: brandPrompt,
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
        type: 'brand',
        size,
        brandId,
        settings: JSON.stringify({ 
          brandName: brand.name, 
          brandColors, 
          styleGuide: brand.styleGuide,
          logoDescription 
        })
      }
    });

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        imageUrl,
        prompt,
        brand: {
          id: brand.id,
          name: brand.name,
          colors: brandColors,
          styleGuide: brand.styleGuide
        },
        size,
        createdAt: savedImage.createdAt
      }
    });
  } catch (error) {
    console.error('Brand image generation error:', error);
    let errorMessage = 'Failed to generate brand image';
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
