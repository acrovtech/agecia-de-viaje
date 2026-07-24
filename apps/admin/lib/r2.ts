import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export function isR2Configured(): boolean {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  return Boolean(
    accountId && accessKeyId && secretAccessKey && accountId !== 'tu_account_id_de_cloudflare'
  );
}

function getR2Client(): S3Client | null {
  if (!isR2Configured()) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

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

    const r2Client = getR2Client();

    if (!r2Client) {
      console.warn('⚠️ Cloudflare R2 no tiene credenciales configuradas en .env. Se usará fallback.');
      return {
        success: true,
        url: `/uploads/${sanitizedFileName}`
      };
    }

    const bucketName = process.env.R2_BUCKET_NAME || 'incabound';

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    const publicDomain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev';
    const baseUrl = publicDomain.endsWith('/') ? publicDomain.slice(0, -1) : publicDomain;
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
