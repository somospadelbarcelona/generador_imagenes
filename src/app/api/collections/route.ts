import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const collections = await db.collection.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { images: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      collections
    });
  } catch (error) {
    console.error('Get collections error:', error);
    return NextResponse.json(
      { error: 'Failed to get collections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const collection = await db.collection.create({
      data: {
        name,
        description,
        icon: icon || '📁',
        color: color || '#0A66C2'
      }
    });

    return NextResponse.json({
      success: true,
      collection
    });
  } catch (error) {
    console.error('Create collection error:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
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
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    await db.generatedImage.updateMany({
      where: { collectionId: id },
      data: { collectionId: null }
    });

    await db.collection.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete collection error:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}
