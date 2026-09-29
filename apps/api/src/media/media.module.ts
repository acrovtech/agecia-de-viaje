import { Module } from '@nestjs/common';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';
import { R2StorageAdapter } from './storage/r2-storage.adapter.js';
import { STORAGE_ADAPTER } from './storage/storage-adapter.interface.js';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    R2StorageAdapter,
    {
      provide: STORAGE_ADAPTER,
      useExisting: R2StorageAdapter,
    },
  ],
  exports: [MediaService, STORAGE_ADAPTER],
})
export class MediaModule {}
