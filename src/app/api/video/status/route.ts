import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la tarea' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const result = await zai.async.result.query(taskId);

    const response: any = {
      taskId,
      status: result.task_status
    };

    if (result.task_status === 'SUCCESS') {
      const videoUrl = result.video_result?.[0]?.url ||
                      result.video_url ||
                      result.url ||
                      result.video;
      
      response.videoUrl = videoUrl;

      // Save to database
      if (videoUrl) {
        try {
          const savedVideo = await db.generatedImage.create({
            data: {
              prompt: `Video: ${taskId}`,
              imageUrl: videoUrl,
              type: 'video',
              size: 'video'
            }
          });
          response.savedId = savedVideo.id;
        } catch (dbError) {
          console.error('Failed to save video to database:', dbError);
        }
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Video status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al verificar estado' },
      { status: 500 }
    );
  }
}
