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

    // Extract color palette using vision
    const analysis = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract the color palette from this image. Return a JSON object with:
1. "dominant": Array of 2-3 most dominant colors with hex codes and names
2. "accent": Array of 2-3 accent colors with hex codes and names  
3. "palette": Array of 6-8 colors representing the full palette with hex codes
4. "mood": The overall color mood (warm, cool, neutral, vibrant, muted, etc.)
5. "suggestedUse": What this color palette would be good for (web design, branding, interior design, etc.)

Format as valid JSON only, no markdown. Example format:
{"dominant":[{"hex":"#FF5733","name":"Vermillion","percentage":35}],"accent":[...],"palette":[...],"mood":"warm","suggestedUse":"..."}

Make sure hex codes are valid (start with # and have 6 characters).`
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
    
    let paletteResult;
    try {
      // Clean up response if needed
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      paletteResult = JSON.parse(cleanJson);
    } catch {
      // Fallback to basic palette
      paletteResult = {
        dominant: [{ hex: '#808080', name: 'Gray', percentage: 50 }],
        accent: [{ hex: '#404040', name: 'Dark Gray', percentage: 30 }],
        palette: ['#808080', '#404040', '#C0C0C0', '#606060', '#A0A0A0', '#303030'],
        mood: 'neutral',
        suggestedUse: 'General design purposes',
        rawResponse: responseText
      };
    }

    return NextResponse.json({
      success: true,
      palette: paletteResult
    });
  } catch (error) {
    console.error('Color palette error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract color palette' },
      { status: 500 }
    );
  }
}
