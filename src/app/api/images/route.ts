import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// API for fetching generated images
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where = type ? { type } : {};

    // Fetch images with brand relations
    const images = await db.generatedImage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            colors: true
          }
        }
      }
    });

    const total = await db.generatedImage.count({ where });

    return NextResponse.json({
      success: true,
      images,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + images.length < total
      }
    });
  } catch (error) {
    console.error('Get images error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get images' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    await db.generatedImage.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete image' },
      { status: 500 }
    );
  }
}
