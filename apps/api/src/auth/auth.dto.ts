import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ format: 'password', description: 'Máximo 72 bytes UTF-8; compatible con bcrypt.' }) password!: string;
  @ApiProperty({ description: 'Agencia de la membresía solicitada.' }) agencySlug!: string;
}

export class SessionDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ enum: ['Bearer'] }) tokenType!: 'Bearer';
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: Date;
  @ApiProperty() agencyId!: string;
}
