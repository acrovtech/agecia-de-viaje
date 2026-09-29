import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { MEDIA_KINDS, type MediaKind } from './media.types.js';

export const uploadMediaSchema = z.object({
  kind: z.enum(MEDIA_KINDS),
});

export const listMediaQuerySchema = z.object({
  kind: z.enum(MEDIA_KINDS).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().trim().max(128).optional(),
});

export type ListMediaQuery = z.infer<typeof listMediaQuerySchema>;

export class MediaAssetResponseDto {
  @ApiProperty({ example: 'clx123abc' })
  id!: string;

  @ApiProperty({ example: 'clx456def' })
  agencyId!: string;

  @ApiProperty({ example: 'agencies/clx456def/tour-banner/abc-123.webp' })
  objectKey!: string;

  @ApiProperty({ example: 'https://cdn.example.com/agencies/clx456def/tour-banner/abc-123.webp' })
  publicUrl!: string;

  @ApiProperty({ enum: MEDIA_KINDS, example: 'TOUR_BANNER' })
  kind!: MediaKind;

  @ApiProperty({ example: 'image/webp' })
  mimeType!: string;

  @ApiProperty({ example: 245100 })
  byteSize!: number;

  @ApiProperty({ required: false, nullable: true, example: 'machu-picchu.webp' })
  originalName?: string | null;

  @ApiProperty({ example: '2026-09-28T20:00:00.000Z' })
  createdAt!: string;
}

export class MediaAssetListResponseDto {
  @ApiProperty({ type: [MediaAssetResponseDto] })
  data!: MediaAssetResponseDto[];

  @ApiProperty({ required: false, nullable: true, example: 'clx789xyz' })
  nextCursor!: string | null;
}
