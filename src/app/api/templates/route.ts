import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEFAULT_TEMPLATES = [
  {
    name: 'Post de Instagram',
    description: 'Imagen cuadrada perfecta para Instagram',
    category: 'social-media',
    promptTemplate: '{subject}, Instagram worthy, vibrant colors, engaging composition, square format optimized',
    settings: JSON.stringify({ size: '1024x1024' })
  },
  {
    name: 'Banner de LinkedIn',
    description: 'Banner profesional para perfil de empresa',
    category: 'social-media',
    promptTemplate: 'Professional {subject}, corporate style, clean design, LinkedIn banner format',
    settings: JSON.stringify({ size: '1440x720' })
  },
  {
    name: 'Producto E-commerce',
    description: 'Foto de producto profesional para tienda online',
    category: 'product',
    promptTemplate: '{subject}, product photography, clean white background, studio lighting, professional e-commerce photo',
    settings: JSON.stringify({ size: '1024x1024' })
  },
  {
    name: 'Logo Minimalista',
    description: 'Logo moderno y minimalista',
    category: 'logo',
    promptTemplate: '{subject} logo, minimalist design, clean lines, modern aesthetic, professional branding',
    settings: JSON.stringify({ size: '1024x1024' })
  },
  {
    name: 'Ilustración de Blog',
    description: 'Ilustración atractiva para artículos de blog',
    category: 'content',
    promptTemplate: '{subject}, blog illustration style, informative visual, engaging composition',
    settings: JSON.stringify({ size: '1344x768' })
  },
  {
    name: 'Historia de Instagram',
    description: 'Imagen vertical para historias',
    category: 'social-media',
    promptTemplate: '{subject}, Instagram story format, vertical composition, eye-catching design',
    settings: JSON.stringify({ size: '720x1440' })
  },
  {
    name: 'Thumbnail YouTube',
    description: 'Miniatura llamativa para videos',
    category: 'social-media',
    promptTemplate: '{subject}, YouTube thumbnail style, bold colors, attention-grabbing, clear subject',
    settings: JSON.stringify({ size: '1440x720' })
  },
  {
    name: 'Fondo de Pantalla',
    description: 'Wallpaper de alta calidad',
    category: 'wallpaper',
    promptTemplate: '{subject}, desktop wallpaper, stunning visual, high resolution, immersive atmosphere',
    settings: JSON.stringify({ size: '1344x768' })
  },
  {
    name: 'Avatar/Perfil',
    description: 'Imagen de perfil profesional',
    category: 'profile',
    promptTemplate: '{subject}, profile picture style, centered composition, clean background, professional look',
    settings: JSON.stringify({ size: '1024x1024' })
  },
  {
    name: 'Presentación Ejecutiva',
    description: 'Slide profesional para presentaciones',
    category: 'presentation',
    promptTemplate: '{subject}, executive presentation style, clean professional look, business appropriate',
    settings: JSON.stringify({ size: '1344x768' })
  }
];

export async function GET() {
  try {
    let templates = await db.template.findMany({
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    if (templates.length === 0) {
      await db.template.createMany({
        data: DEFAULT_TEMPLATES
      });
      templates = await db.template.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Failed to get templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, promptTemplate, negativePrompt, settings } = body;

    if (!name || !promptTemplate) {
      return NextResponse.json(
        { error: 'Name and prompt template are required' },
        { status: 400 }
      );
    }

    const template = await db.template.create({
      data: {
        name,
        description,
        category: category || 'custom',
        promptTemplate,
        negativePrompt,
        settings
      }
    });

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
