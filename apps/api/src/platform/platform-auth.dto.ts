import { ApiProperty } from '@nestjs/swagger';

export class PlatformLoginDto {
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ format: 'password', description: 'Máximo 72 bytes UTF-8; compatible con bcrypt.' }) password!: string;
}

export class PlatformSessionDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ enum: ['Bearer'] }) tokenType!: 'Bearer';
  @ApiProperty({ type: String, format: 'date-time' }) expiresAt!: Date;
  @ApiProperty() admin!: {
    id: string;
    email: string;
    displayName: string | null;
    role: string;
  };
}
