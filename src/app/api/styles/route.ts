import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const styles = await db.style.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { images: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      styles
    });
  } catch (error) {
    console.error('Get styles error:', error);
    return NextResponse.json(
      { error: 'Failed to get styles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, promptSuffix, exampleUrl, category } = body;

    if (!name || !promptSuffix) {
      return NextResponse.json(
        { error: 'Name and prompt suffix are required' },
        { status: 400 }
      );
    }

    const style = await db.style.create({
      data: {
        name,
        description: description || '',
        promptSuffix,
        exampleUrl,
        category: category || 'custom'
      }
    });

    return NextResponse.json({
      success: true,
      style
    });
  } catch (error) {
    console.error('Create style error:', error);
    return NextResponse.json(
      { error: 'Failed to create style' },
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
        { error: 'Style ID is required' },
        { status: 400 }
      );
    }

    await db.style.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete style error:', error);
    return NextResponse.json(
      { error: 'Failed to delete style' },
      { status: 500 }
    );
  }
}
