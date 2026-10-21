import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

const safeUrlSchema = z
  .string()
  .trim()
  .url()
  .max(1000)
  .refine(
    (url) => {
      if (!url) return true;
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Solo se permiten URLs con protocolo http o https' }
  )
  .nullable()
  .optional();

export const updatePlatformSettingsSchema = z.object({
  productName: z.string().trim().min(1).max(100),
  logoUrl: safeUrlSchema,
  iconUrl: safeUrlSchema,
  coBrandingEnabled: z.boolean().default(true),
  brandingRewardEnabled: z.boolean(),
  brandingRewardCredits: z.number().int().min(0).max(100000),
}).strict();

export class UpdatePlatformSettingsDto {
  @ApiProperty({ example: 'Acrov SaaS' })
  productName!: string;

  @ApiPropertyOptional({ example: 'https://r2.example.com/platform-logo.webp' })
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://r2.example.com/platform-icon.webp' })
  iconUrl?: string | null;

  @ApiProperty({ example: true, default: true })
  coBrandingEnabled!: boolean;

  @ApiProperty({ example: true })
  brandingRewardEnabled!: boolean;

  @ApiProperty({ example: 10 })
  brandingRewardCredits!: number;
}
