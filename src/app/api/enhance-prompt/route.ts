import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, context } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert prompt engineer for AI image generation. Enhance user prompts to create better, more detailed images.

Rules:
1. Add specific details about lighting, composition, and style
2. Include quality modifiers (high quality, detailed, professional)
3. Add relevant artistic style references when appropriate
4. Keep the core subject intact
5. Be concise but comprehensive
6. Return ONLY the enhanced prompt, no explanations`
        },
        {
          role: 'user',
          content: context 
            ? `Context: ${context}\n\nOriginal prompt: ${prompt}\n\nEnhance this prompt:`
            : `Original prompt: ${prompt}\n\nEnhance this prompt:`
        }
      ],
      thinking: { type: 'disabled' }
    });

    const enhancedPrompt = completion.choices[0]?.message?.content || prompt;

    const negativeCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Generate a list of things to avoid (negative prompt) for the given image prompt.
Return a comma-separated list of negative terms. Focus on: blur, distortion, low quality, unwanted elements.
Return ONLY the negative terms, comma-separated.`
        },
        {
          role: 'user',
          content: `Generate negative prompt for: ${enhancedPrompt}`
        }
      ],
      thinking: { type: 'disabled' }
    });

    const negativePrompt = negativeCompletion.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      originalPrompt: prompt,
      enhancedPrompt,
      negativePrompt,
      suggestions: {
        styles: ['photorealistic', 'digital art', 'oil painting', 'watercolor', '3D render', 'anime', 'cinematic'],
        lighting: ['natural light', 'studio lighting', 'golden hour', 'dramatic lighting', 'soft diffused light'],
        moods: ['professional', 'playful', 'dramatic', 'peaceful', 'energetic', 'mysterious']
      }
    });
  } catch (error) {
    console.error('Prompt enhance error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
}
