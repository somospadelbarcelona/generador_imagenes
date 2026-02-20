import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
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
    const { imageUrl, objectDescription } = body;

    if (!imageUrl || !objectDescription) {
      return NextResponse.json(
        { error: 'Image URL and object description are required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Analyze image
    const analysis = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image. The user wants to REMOVE: "${objectDescription}". Describe the complete image scene WITHOUT mentioning the object to be removed. Focus on what should remain. Be detailed about the setting, other elements, lighting, and composition.`
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

    const sceneWithoutObject = analysis.choices[0]?.message?.content || '';

    // Generate new image without the object
    const prompt = `${sceneWithoutObject}. The scene should look natural and complete, as if the removed object was never there. High quality, detailed, professional.`;

    const response = await retryWithBackoff(
      async () => await zai.images.generations.create({
        prompt,
        size: '1024x1024'
      })
    );

    const imageBase64 = response.data[0].base64;
    const newImageUrl = `data:image/png;base64,${imageBase64}`;

    const savedImage = await db.generatedImage.create({
      data: {
        prompt: `Remove "${objectDescription}" from image`,
        imageUrl: newImageUrl,
        type: 'object-remove',
        size: '1024x1024',
        sourceImage: imageUrl,
        settings: JSON.stringify({ objectDescription, sceneDescription: sceneWithoutObject })
      }
    });

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        imageUrl: newImageUrl,
        removedObject: objectDescription
      }
    });
  } catch (error) {
    console.error('Object removal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove object' },
      { status: 500 }
    );
  }
}
