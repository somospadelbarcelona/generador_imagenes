import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      imageUrl, 
      quality = 'quality', 
      duration = 10, 
      fps = 60,
      size = '1920x1080',
      withAudio = false
    } = body;

    if (!prompt && !imageUrl) {
      return NextResponse.json(
        { error: 'Se requiere una descripción o una imagen' },
        { status: 400 }
      );
    }

    console.log('Starting video generation...');

    const zai = await ZAI.create();

    // Create video generation task
    const taskParams: any = {
      quality,
      duration,
      fps,
      with_audio: withAudio
    };

    if (prompt) {
      taskParams.prompt = prompt;
    }

    if (imageUrl) {
      taskParams.image_url = imageUrl;
    }

    if (size) {
      taskParams.size = size;
    }

    const task = await zai.video.generations.create(taskParams);

    console.log('Video task created:', task.id);

    return NextResponse.json({
      success: true,
      taskId: task.id,
      status: task.task_status,
      message: 'Video generation started. Use the taskId to check status.'
    });
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar video' },
      { status: 500 }
    );
  }
}
