import { BadRequestException } from '@nestjs/common';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  AllowedImageMimeType,
  MAX_MEDIA_FILE_SIZE_BYTES,
} from '../media.types.js';

export interface ValidatedImage {
  mimeType: AllowedImageMimeType;
  extension: string;
  byteSize: number;
}

/**
 * Detects image MIME type from magic bytes.
 * Returns null if no recognized image signature is matched.
 */
function detectMimeTypeFromMagicBytes(buffer: Buffer): AllowedImageMimeType | null {
  if (buffer.length < 12) {
    return null;
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // 3. WEBP: RIFF at 0..3, WEBP at 8..11
  if (
    buffer[0] === 0x52 && // 'R'
    buffer[1] === 0x49 && // 'I'
    buffer[2] === 0x46 && // 'F'
    buffer[3] === 0x46 && // 'F'
    buffer[8] === 0x57 && // 'W'
    buffer[9] === 0x45 && // 'E'
    buffer[10] === 0x42 && // 'B'
    buffer[11] === 0x50 // 'P'
  ) {
    return 'image/webp';
  }

  // 4. AVIF: offset 4..7 is 'ftyp', offset 8..11 is 'avif', 'avis', or 'mif1'
  if (
    buffer[4] === 0x66 && // 'f'
    buffer[5] === 0x74 && // 't'
    buffer[6] === 0x79 && // 'y'
    buffer[7] === 0x70 // 'p'
  ) {
    const brand = buffer.subarray(8, 12).toString('ascii').toLowerCase();
    if (['avif', 'avis', 'mif1', 'msf1'].includes(brand)) {
      return 'image/avif';
    }
  }

  return null;
}

const MIME_TO_CANONICAL_EXTENSION: Record<AllowedImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const ALLOWED_EXTENSIONS_BY_MIME: Record<AllowedImageMimeType, readonly string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
};

/**
 * Validates file buffer, detected magic bytes, declared MIME type, and extension.
 * Fails closed on any discrepancy or disallowed content (SVG, HTML, JS, scripts, executables).
 */
export function validateImageFile(
  buffer: Buffer,
  originalFilename?: string,
  declaredMimeType?: string
): ValidatedImage {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestException('El archivo está vacío');
  }

  if (buffer.length > MAX_MEDIA_FILE_SIZE_BYTES) {
    throw new BadRequestException(
      `El archivo excede el tamaño máximo permitido (${MAX_MEDIA_FILE_SIZE_BYTES / (1024 * 1024)} MiB)`
    );
  }

  // Prevent SVG, HTML, scripts, or XML masquerading
  const headerSample = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('utf-8').toLowerCase();
  if (
    headerSample.includes('<svg') ||
    headerSample.includes('<?xml') ||
    headerSample.includes('<html') ||
    headerSample.includes('<!doctype') ||
    headerSample.includes('<script') ||
    headerSample.includes('javascript:')
  ) {
    throw new BadRequestException('Contenido de tipo SVG, HTML o scripts no está permitido por seguridad');
  }

  // Detect real MIME type from signature
  const detectedMime = detectMimeTypeFromMagicBytes(buffer);
  if (!detectedMime || !ALLOWED_IMAGE_MIME_TYPES.includes(detectedMime)) {
    throw new BadRequestException(
      'Formato de imagen no soportado o inválido. Solo se admiten archivos JPEG, PNG, WEBP y AVIF válidos.'
    );
  }

  // Validate declared MIME type if provided
  if (declaredMimeType) {
    const cleanDeclared = declaredMimeType.trim().toLowerCase();
    if (cleanDeclared !== detectedMime) {
      // JPEG exception for image/jpeg vs image/jpg
      const isJpegEquiv = (cleanDeclared === 'image/jpg' || cleanDeclared === 'image/jpeg') && detectedMime === 'image/jpeg';
      if (!isJpegEquiv) {
        throw new BadRequestException(
          `Discrepancia entre el tipo MIME declarado (${cleanDeclared}) y el contenido real detectado (${detectedMime})`
        );
      }
    }
  }

  // Validate extension if filename provided
  if (originalFilename) {
    const lowerFilename = originalFilename.trim().toLowerCase();
    const lastDot = lowerFilename.lastIndexOf('.');
    if (lastDot === -1) {
      throw new BadRequestException('El nombre de archivo debe incluir una extensión válida (.jpg, .png, .webp, .avif)');
    }
    const ext = lowerFilename.slice(lastDot);
    const validExtensions = ALLOWED_EXTENSIONS_BY_MIME[detectedMime];
    if (!validExtensions.includes(ext)) {
      throw new BadRequestException(
        `La extensión "${ext}" no coincide con el formato real del archivo (${detectedMime}). Extensiones permitidas: ${validExtensions.join(', ')}`
      );
    }
  }

  return {
    mimeType: detectedMime,
    extension: MIME_TO_CANONICAL_EXTENSION[detectedMime],
    byteSize: buffer.length,
  };
}
