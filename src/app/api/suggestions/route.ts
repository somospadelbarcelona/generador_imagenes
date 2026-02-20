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

    // Generate suggestions based on the prompt
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert creative consultant for AI image generation. Given a user's prompt, provide helpful suggestions to improve and expand their creative options.

Return a JSON object with these exact keys:
{
  "improvements": ["3-4 specific ways to improve the prompt"],
  "styleSuggestions": ["3-4 style options that would work well"],
  "moodOptions": ["3-4 mood/atmosphere options"],
  "lightingOptions": ["3-4 lighting suggestions"],
  "compositionTips": ["2-3 composition tips"],
  "relatedPrompts": ["2-3 related prompt ideas"],
  "quickVariations": ["3 quick variations of the original prompt"]
}

Be creative but practical. Return valid JSON only.`
        },
        {
          role: 'user',
          content: context 
            ? `Context: ${context}\n\nUser's prompt: "${prompt}"\n\nProvide creative suggestions.`
            : `User's prompt: "${prompt}"\n\nProvide creative suggestions to improve and expand this prompt.`
        }
      ],
      thinking: { type: 'disabled' }
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    let suggestions;
    try {
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      suggestions = JSON.parse(cleanJson);
    } catch {
      suggestions = {
        improvements: ['Add more specific details', 'Include lighting direction', 'Specify art style'],
        styleSuggestions: ['Photorealistic', 'Digital art', 'Oil painting', '3D render'],
        moodOptions: ['Professional', 'Dramatic', 'Peaceful', 'Energetic'],
        lightingOptions: ['Natural light', 'Studio lighting', 'Golden hour', 'Dramatic shadows'],
        compositionTips: ['Use rule of thirds', 'Consider depth of field', 'Balance elements'],
        relatedPrompts: [],
        quickVariations: [prompt + ' with cinematic lighting', prompt + ' in digital art style']
      };
    }

    return NextResponse.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
