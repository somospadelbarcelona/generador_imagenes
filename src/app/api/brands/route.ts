import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const brands = await db.brand.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { images: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      brands
    });
  } catch (error) {
    console.error('Get brands error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get brands' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, logoUrl, colors, styleGuide } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    const brand = await db.brand.create({
      data: {
        name,
        logoUrl,
        colors: JSON.stringify(colors || []),
        styleGuide
      }
    });

    return NextResponse.json({
      success: true,
      brand
    });
  } catch (error) {
    console.error('Create brand error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create brand' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, logoUrl, colors, styleGuide } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    const brand = await db.brand.update({
      where: { id },
      data: {
        name,
        logoUrl,
        colors: JSON.stringify(colors || []),
        styleGuide
      }
    });

    return NextResponse.json({
      success: true,
      brand
    });
  } catch (error) {
    console.error('Update brand error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update brand' },
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
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    await db.brand.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete brand error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete brand' },
      { status: 500 }
    );
  }
}
