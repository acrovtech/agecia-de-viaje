import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Configuración del cliente S3 para Cloudflare R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'incabound-bucket';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'https://pub-xxxxxx.r2.dev';

export const isR2Configured = Boolean(
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ACCOUNT_ID !== 'your_cloudflare_account_id'
);

const r2Client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

/**
 * Sube un archivo a Cloudflare R2 Bucket y retorna su URL pública.
 * Si R2 no está configurado aún con credenciales reales, retorna un fallback transparente.
 */
export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'assets'
): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const sanitizedFolder = folder.replace(/^\/+|\/+$/g, '') || 'assets';
    const key = `${sanitizedFolder}/${timestamp}-${sanitizedFileName}`;

    if (!isR2Configured || !r2Client) {
      console.warn('⚠️ Cloudflare R2 no tiene credenciales configuradas en .env. Se usará fallback.');
      return {
        success: true,
        url: `/uploads/${sanitizedFileName}`
      };
    }

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    const baseUrl = R2_PUBLIC_DOMAIN.endsWith('/') ? R2_PUBLIC_DOMAIN.slice(0, -1) : R2_PUBLIC_DOMAIN;
    const publicUrl = `${baseUrl}/${key}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error('❌ Error al subir imagen a Cloudflare R2:', error);
    return {
      success: false,
      url: '',
      error: error.message || 'Error al subir la imagen a Cloudflare R2',
    };
  }
}
