import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

const EXPAND_DIRECTIONS = {
  left: 'extend the scene to the left side',
  right: 'extend the scene to the right side',
  top: 'extend the scene upward, adding more sky or ceiling',
  bottom: 'extend the scene downward, adding more ground or floor',
  all: 'extend the scene in all directions, creating a wider panoramic view'
};

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxRetries - 1) throw lastError;
      await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, direction = 'all', expansionDescription = '' } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Analyze the current image
    const analysis = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this image scene in detail, including: setting/location, objects, atmosphere, lighting, colors, and composition. Focus on what could plausibly exist beyond the current frame borders.'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    });

    const sceneDescription = analysis.choices[0]?.message?.content || '';

    // Build expansion prompt
    const directionText = EXPAND_DIRECTIONS[direction as keyof typeof EXPAND_DIRECTIONS] || EXPAND_DIRECTIONS.all;
    const expandPrompt = `${sceneDescription}. ${directionText}. ${expansionDescription ? `Additional details: ${expansionDescription}.` : ''} Maintain the same artistic style, lighting, and atmosphere. Seamless extension that matches the original perfectly. High quality, detailed, professional.`;

    // Use landscape size for expanded images
    const size = direction === 'top' || direction === 'bottom' ? '768x1344' : '1344x768';

    const response = await retryWithBackoff(
      async () => await zai.images.generations.create({
        prompt: expandPrompt,
        size: size
      })
    );

    const imageBase64 = response.data[0].base64;
    const newImageUrl = `data:image/png;base64,${imageBase64}`;

    const savedImage = await db.generatedImage.create({
      data: {
        prompt: `Outpaint: ${direction}`,
        imageUrl: newImageUrl,
        type: 'outpaint',
        size,
        sourceImage: imageUrl,
        settings: JSON.stringify({ direction, expansionDescription, sceneDescription })
      }
    });

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        imageUrl: newImageUrl,
        direction,
        size
      }
    });
  } catch (error) {
    console.error('Outpaint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to expand image' },
      { status: 500 }
    );
  }
}
