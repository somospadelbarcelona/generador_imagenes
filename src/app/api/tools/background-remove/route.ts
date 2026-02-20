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
        lastError.message.includes('fetch failed');
      
      if (!isRetryableError || attempt === maxRetries - 1) throw lastError;
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, preserveSubject = true } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Analyze the image first
    const analysis = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe the main subject of this image in detail. What is the central focus? Describe the subject\'s position, pose, expression, clothing, and key visual features. This will be used to isolate the subject from the background.'
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

    const subjectDescription = analysis.choices[0]?.message?.content || '';

    // Generate new image with transparent/plain background
    const bgPrompt = preserveSubject
      ? `${subjectDescription}. Isolated on a clean white background, product photography style, professional studio lighting, high quality, no background elements, subject centered.`
      : `${subjectDescription}. Professional product shot, clean minimal background, studio lighting.`;

    const response = await retryWithBackoff(
      async () => await zai.images.generations.create({
        prompt: bgPrompt,
        size: '1024x1024'
      }),
      3,
      3000
    );

    const imageBase64 = response.data[0].base64;
    const newImageUrl = `data:image/png;base64,${imageBase64}`;

    const savedImage = await db.generatedImage.create({
      data: {
        prompt: `Background removal: ${subjectDescription.substring(0, 100)}`,
        imageUrl: newImageUrl,
        type: 'background-remove',
        size: '1024x1024',
        sourceImage: imageUrl,
        settings: JSON.stringify({ preserveSubject, originalSubject: subjectDescription })
      }
    });

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        imageUrl: newImageUrl,
        originalSubject: subjectDescription
      }
    });
  } catch (error) {
    console.error('Background removal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove background' },
      { status: 500 }
    );
  }
}
