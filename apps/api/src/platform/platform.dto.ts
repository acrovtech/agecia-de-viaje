import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const updatePlatformSettingsSchema = z.object({
  productName: z.string().trim().min(1).max(100),
  logoUrl: z.string().trim().url().max(1000).nullable().optional(),
  iconUrl: z.string().trim().url().max(1000).nullable().optional(),
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

  @ApiProperty({ example: true })
  brandingRewardEnabled!: boolean;

  @ApiProperty({ example: 10 })
  brandingRewardCredits!: number;
}
