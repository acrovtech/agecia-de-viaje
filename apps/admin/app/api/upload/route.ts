import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'assets';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se ha adjuntado ningún archivo.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToR2(buffer, file.name, file.type || 'image/jpeg', folder);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url
    });
  } catch (error: any) {
    console.error('Error en el endpoint de subida de imágenes:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor al procesar la imagen.' },
      { status: 500 }
    );
  }
}
