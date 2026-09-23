import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@repo/db/prisma';
import { API_CONFIG, ApiConfig } from '../config.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(API_CONFIG) config: ApiConfig) {
    super({ datasources: { db: { url: config.databaseUrl } } });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
