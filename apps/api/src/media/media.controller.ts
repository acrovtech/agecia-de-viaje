import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AgencyRoles } from '../security/public-route.js';
import type { AuthenticatedRequest } from '../auth/auth.controller.js';
import { MediaService } from './media.service.js';
import {
  MediaAssetListResponseDto,
  MediaAssetResponseDto,
} from './media.dto.js';
import { MEDIA_KINDS } from './media.types.js';

export interface UploadedMulterFile {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
}

@Controller({ path: 'agencies/:agencyId/media', version: '1' })
@ApiTags('media')
@ApiBearerAuth()
@AgencyRoles('OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @AgencyRoles('OWNER', 'ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Sube un archivo de imagen autorizado para la agencia a Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia propietaria del archivo' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'kind'],
      properties: {
        file: { type: 'string', format: 'binary' },
        kind: { type: 'string', enum: [...MEDIA_KINDS] },
      },
    },
  })
  @ApiOkResponse({ type: MediaAssetResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @UploadedFile() file: UploadedMulterFile | undefined,
    @Body() body: unknown
  ): Promise<MediaAssetResponseDto> {
    return this.mediaService.uploadMedia(req.identity, agencyId, file, body);
  }

  @Get()
  @ApiOperation({ summary: 'Lista los archivos multimedia pertenecientes a la agencia con paginación' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  @ApiOkResponse({ type: MediaAssetListResponseDto })
  async list(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') _agencyId: string,
    @Query() query: unknown
  ): Promise<MediaAssetListResponseDto> {
    // Derives agency strictly from authenticated identity
    return this.mediaService.listMedia(req.identity.agencyId, query);
  }

  @Delete(':mediaId')
  @AgencyRoles('OWNER', 'ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Elimina un archivo multimedia de la agencia en Cloudflare R2 y la base de datos' })
  @ApiParam({ name: 'agencyId', description: 'ID de la agencia' })
  @ApiParam({ name: 'mediaId', description: 'ID del archivo multimedia a eliminar' })
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('agencyId') agencyId: string,
    @Param('mediaId') mediaId: string
  ): Promise<{ success: boolean; id: string }> {
    return this.mediaService.deleteMedia(req.identity, agencyId, mediaId);
  }
}
