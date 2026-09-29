import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { API_CONFIG, type ApiConfig } from '../../config.js';
import type { StorageAdapter } from './storage-adapter.interface.js';

@Injectable()
export class R2StorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(R2StorageAdapter.name);
  private client: S3Client | null = null;

  constructor(@Inject(API_CONFIG) private readonly config: ApiConfig) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.r2AccountId &&
        this.config.r2AccessKeyId &&
        this.config.r2SecretAccessKey &&
        this.config.r2BucketName &&
        this.config.r2PublicDomain
    );
  }

  private getClient(): S3Client {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'El almacenamiento de medios en la nube (Cloudflare R2) no está configurado en el servidor'
      );
    }

    if (!this.client) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${this.config.r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.config.r2AccessKeyId,
          secretAccessKey: this.config.r2SecretAccessKey,
        },
      });
    }

    return this.client;
  }

  async putObject(params: { key: string; body: Buffer; contentType: string }): Promise<void> {
    const s3 = this.getClient();
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: this.config.r2BucketName,
          Key: params.key,
          Body: params.body,
          ContentType: params.contentType,
        })
      );
    } catch {
      this.logger.error(
        JSON.stringify({
          event: 'r2_put_object_failed',
          key: params.key,
        })
      );
      throw new ServiceUnavailableException('Fallo al persistir el objeto multimedia en Cloudflare R2');
    }
  }

  async deleteObject(key: string): Promise<void> {
    const s3 = this.getClient();
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: this.config.r2BucketName,
          Key: key,
        })
      );
    } catch {
      this.logger.error(
        JSON.stringify({
          event: 'r2_delete_object_failed',
          key,
        })
      );
      throw new ServiceUnavailableException('Fallo al eliminar el objeto multimedia en Cloudflare R2');
    }
  }
}
