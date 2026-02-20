import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Analyze image using Vision model
    const analysis = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image in extreme detail and provide:
1. MAIN SUBJECT: Describe the main subject(s) in detail
2. COMPOSITION: Camera angle, framing, perspective
3. LIGHTING: Type of lighting, direction, mood
4. COLORS: Main color palette (list hex codes if possible)
5. STYLE: Art style, photography style, aesthetic
6. MOOD: Overall mood and atmosphere
7. DETAILS: Key visual elements, textures, patterns
8. BACKGROUND: Description of background/setting
9. SUGGESTED PROMPT: A detailed prompt that could recreate this image
10. NEGATIVE PROMPT: What to avoid to get this result

Format as JSON with these exact keys: mainSubject, composition, lighting, colors, style, mood, details, background, suggestedPrompt, negativePrompt`
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

    const responseText = analysis.choices[0]?.message?.content || '';
    
    // Try to parse as JSON, fallback to structured object
    let analysisResult;
    try {
      analysisResult = JSON.parse(responseText);
    } catch {
      analysisResult = {
        mainSubject: responseText,
        suggestedPrompt: responseText,
        rawAnalysis: responseText
      };
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
