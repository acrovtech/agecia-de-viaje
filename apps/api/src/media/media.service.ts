import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Prisma } from '@repo/db/prisma';
import { API_CONFIG, type ApiConfig } from '../config.js';
import { PrismaService } from '../database/prisma.service.js';
import type { ApiIdentity } from '../auth/auth.service.js';
import {
  STORAGE_ADAPTER,
  type StorageAdapter,
} from './storage/storage-adapter.interface.js';
import {
  listMediaQuerySchema,
  uploadMediaSchema,
  type MediaAssetListResponseDto,
  type MediaAssetResponseDto,
} from './media.dto.js';
import {
  MEDIA_KIND_FOLDER_MAP,
  type MediaKind,
} from './media.types.js';
import { validateImageFile } from './validation/image-validator.js';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
  ) {}

  private serializeAsset(asset: {
    id: string;
    agencyId: string;
    objectKey: string;
    publicUrl: string;
    kind: string;
    mimeType: string;
    byteSize: number;
    originalName: string | null;
    createdAt: Date;
  }): MediaAssetResponseDto {
    return {
      id: asset.id,
      agencyId: asset.agencyId,
      objectKey: asset.objectKey,
      publicUrl: asset.publicUrl,
      kind: asset.kind as MediaKind,
      mimeType: asset.mimeType,
      byteSize: asset.byteSize,
      originalName: asset.originalName,
      createdAt: asset.createdAt.toISOString(),
    };
  }

  async uploadMedia(
    identity: ApiIdentity,
    agencyId: string,
    file: { buffer?: Buffer; originalname?: string; mimetype?: string } | undefined,
    body: unknown
  ): Promise<MediaAssetResponseDto> {
    // 1. Strict tenant boundary validation
    if (!identity.agencyId || identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para subir archivos en esta agencia');
    }

    // 2. Fail-closed feature flag check
    if (!this.config.mediaUploadEnabled) {
      throw new ServiceUnavailableException('La funcionalidad de subida de archivos está deshabilitada');
    }

    // 3. Fail-closed storage configuration check (Never return fake /uploads/...)
    if (!this.storage.isConfigured()) {
      throw new ServiceUnavailableException(
        'El almacenamiento de medios en la nube (Cloudflare R2) no está configurado'
      );
    }

    // 4. Validate semantic media kind
    const parsedBody = uploadMediaSchema.safeParse(body);
    if (!parsedBody.success) {
      const issue = parsedBody.error.issues[0]?.message || 'Tipo de medio no válido';
      throw new BadRequestException(`Parámetro kind inválido: ${issue}`);
    }
    const mediaKind = parsedBody.data.kind;

    // 5. Validate file payload
    if (!file || !file.buffer) {
      throw new BadRequestException('Se requiere adjuntar un archivo de imagen válido');
    }

    // 6. Strict file validation (magic bytes, size, format, extension)
    const validated = validateImageFile(file.buffer, file.originalname, file.mimetype);

    // 7. Authoritative server-side object key generation
    // Shape: agencies/{agencyId}/{folder}/{random-uuid}.{ext}
    const folder = MEDIA_KIND_FOLDER_MAP[mediaKind];
    const randomId = randomUUID();
    const objectKey = `agencies/${identity.agencyId}/${folder}/${randomId}.${validated.extension}`;

    // 8. Server-authoritative public URL generation
    const baseUrl = this.config.r2PublicDomain.replace(/\/+$/, '');
    const publicUrl = `${baseUrl}/${objectKey}`;

    // 9. Persist object to Cloudflare R2 / Storage adapter
    try {
      await this.storage.putObject({
        key: objectKey,
        body: file.buffer,
        contentType: validated.mimeType,
      });
    } catch (storageError) {
      this.logger.error(`Storage adapter putObject failed for key ${objectKey}:`, storageError);
      throw new ServiceUnavailableException('Error al almacenar el archivo en el proveedor de almacenamiento');
    }

    // 10. Persist metadata and audit atomically in PostgreSQL
    const sanitizedOriginalName = file.originalname
      ? file.originalname.slice(0, 200).replace(/[^\w.\-\s]/g, '_')
      : null;

    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.mediaAsset.create({
        data: {
          agencyId: identity.agencyId,
          objectKey,
          publicUrl,
          kind: mediaKind,
          mimeType: validated.mimeType,
          byteSize: validated.byteSize,
          originalName: sanitizedOriginalName,
          uploadedById: identity.userId,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          userId: identity.userId,
          entity: 'MediaAsset',
          entityId: created.id,
          action: 'MEDIA_UPLOAD',
          details: {
            agencyId: identity.agencyId,
            membershipId: identity.membershipId,
            role: identity.role,
            kind: mediaKind,
            objectKey,
            byteSize: validated.byteSize,
          },
        },
      });

      return created;
    });

    return this.serializeAsset(record);
  }

  async listMedia(
    agencyId: string,
    queryRaw: unknown
  ): Promise<MediaAssetListResponseDto> {
    const parsedQuery = listMediaQuerySchema.safeParse(queryRaw);
    if (!parsedQuery.success) {
      throw new BadRequestException('Parámetros de consulta no válidos');
    }

    const { kind, limit, cursor } = parsedQuery.data;

    const where: Prisma.MediaAssetWhereInput = {
      agencyId,
      ...(kind ? { kind } : {}),
    };

    const rows = await this.prisma.mediaAsset.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | null = null;
    if (rows.length > limit) {
      const nextItem = rows.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return {
      data: rows.map((r) => this.serializeAsset(r)),
      nextCursor,
    };
  }

  async deleteMedia(
    identity: ApiIdentity,
    agencyId: string,
    mediaId: string
  ): Promise<{ success: boolean; id: string }> {
    // 1. Strict tenant boundary validation
    if (!identity.agencyId || identity.agencyId !== agencyId) {
      throw new ForbiddenException('No tienes permiso para eliminar archivos en esta agencia');
    }

    // 2. Fetch asset with tenant filter
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: mediaId, agencyId: identity.agencyId },
    });

    if (!asset) {
      throw new NotFoundException('Archivo multimedia no encontrado en esta agencia');
    }

    // 3. Delete from underlying storage
    if (this.storage.isConfigured()) {
      try {
        await this.storage.deleteObject(asset.objectKey);
      } catch (storageError) {
        this.logger.error(`Storage adapter deleteObject failed for key ${asset.objectKey}:`, storageError);
        throw new ServiceUnavailableException('Error al eliminar el archivo del proveedor de almacenamiento');
      }
    }

    // 4. Remove database record and log audit atomically
    await this.prisma.$transaction(async (tx) => {
      await tx.mediaAsset.delete({
        where: { id: asset.id },
      });

      await tx.adminAuditLog.create({
        data: {
          userId: identity.userId,
          entity: 'MediaAsset',
          entityId: asset.id,
          action: 'MEDIA_DELETE',
          details: {
            agencyId: identity.agencyId,
            membershipId: identity.membershipId,
            role: identity.role,
            kind: asset.kind,
            objectKey: asset.objectKey,
          },
        },
      });
    });

    return { success: true, id: mediaId };
  }
}
