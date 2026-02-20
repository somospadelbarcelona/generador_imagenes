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
    const { audioBase64, additionalPrompt = '', size = '1024x1024' } = body;

    if (!audioBase64) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Transcribe audio with retry
    const asrResponse = await retryWithBackoff(
      async () => {
        return await zai.audio.asr.create({
          file_base64: audioBase64
        });
      },
      3,
      2000
    );

    const transcribedText = asrResponse.text;

    if (!transcribedText || transcribedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not transcribe audio or audio is empty' },
        { status: 400 }
      );
    }

    const imagePrompt = additionalPrompt
      ? `${transcribedText}. ${additionalPrompt}. High quality, detailed, professional`
      : `${transcribedText}. High quality, detailed, professional`;

    // Generate image with retry
    const imageResponse = await retryWithBackoff(
      async () => {
        return await zai.images.generations.create({
          prompt: imagePrompt,
          size: size
        });
      },
      3,
      3000
    );

    const imageBase64 = imageResponse.data[0].base64;
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    const savedImage = await db.generatedImage.create({
      data: {
        prompt: imagePrompt,
        imageUrl,
        type: 'audio-to-image',
        size,
        sourceAudio: audioBase64.substring(0, 100) + '...',
        settings: JSON.stringify({ transcribedText })
      }
    });

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        imageUrl,
        prompt: imagePrompt,
        transcribedText,
        size,
        createdAt: savedImage.createdAt
      }
    });
  } catch (error) {
    console.error('Audio-to-image error:', error);
    let errorMessage = 'Failed to generate image from audio';
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
