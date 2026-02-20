import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

interface EditSettings {
  background?: string;
  style?: string;
  lighting?: string;
  elements?: string;
  composition?: string;
  customPrompt?: string;
}

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
    const { sourceImage, editType, settings, size = '1024x1024' } = body as {
      sourceImage: string;
      editType: 'background' | 'style' | 'lighting' | 'elements' | 'composition' | 'custom';
      settings: EditSettings;
      size: string;
    };

    if (!sourceImage) {
      return NextResponse.json(
        { error: 'Source image is required' },
        { status: 400 }
      );
    }

    if (!editType) {
      return NextResponse.json(
        { error: 'Edit type is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Analyze image with retry
    const analysisResponse = await retryWithBackoff(
      async () => {
        return await zai.chat.completions.createVision({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this image in detail. Describe: 1) Main subject, 2) Current background, 3) Current style, 4) Lighting conditions, 5) Key elements, 6) Composition. Be specific and thorough.'
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

    const imageAnalysis = analysisResponse.choices[0]?.message?.content || '';

    let editPrompt = '';
    
    switch (editType) {
      case 'background':
        editPrompt = `Original image analysis: ${imageAnalysis}. Change the background to: ${settings.background || 'a clean, professional studio background'}. Keep the main subject exactly the same, only replace the background seamlessly.`;
        break;
      case 'style':
        editPrompt = `Original image analysis: ${imageAnalysis}. Transform the style to: ${settings.style || 'professional photography style'}. Maintain the subject and composition but apply the new artistic style.`;
        break;
      case 'lighting':
        editPrompt = `Original image analysis: ${imageAnalysis}. Change the lighting to: ${settings.lighting || 'dramatic studio lighting'}. Keep all subjects and composition the same, only adjust the lighting.`;
        break;
      case 'elements':
        editPrompt = `Original image analysis: ${imageAnalysis}. Modify elements: ${settings.elements || 'enhance visual elements'}. Keep the main subject and composition, enhance or modify specific elements.`;
        break;
      case 'composition':
        editPrompt = `Original image analysis: ${imageAnalysis}. Adjust composition: ${settings.composition || 'improve overall composition'}. Keep the subject but improve the framing and visual balance.`;
        break;
      case 'custom':
        editPrompt = `Original image analysis: ${imageAnalysis}. Apply the following custom edit: ${settings.customPrompt || ''}. Maintain image quality and coherence.`;
        break;
      default:
        editPrompt = `Original image analysis: ${imageAnalysis}. Enhance and improve the image while maintaining its essence.`;
    }

    editPrompt += '. High quality, detailed, professional, photorealistic.';

    // Generate edited image with retry
    const response = await retryWithBackoff(
      async () => {
        return await zai.images.generations.create({
          prompt: editPrompt,
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
        prompt: editPrompt,
        imageUrl,
        type: 'edit',
        size,
        sourceImage,
        settings: JSON.stringify({ editType, settings, originalAnalysis: imageAnalysis })
      }
    });

    return NextResponse.json({
      success: true,
      image: {
        id: savedImage.id,
        imageUrl,
        editType,
        originalAnalysis: imageAnalysis,
        size,
        createdAt: savedImage.createdAt
      }
    });
  } catch (error) {
    console.error('Image edit error:', error);
    let errorMessage = 'Failed to edit image';
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
