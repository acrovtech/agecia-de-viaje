import { Injectable } from '@nestjs/common';
import type { StorageAdapter } from './storage-adapter.interface.js';

@Injectable()
export class MockStorageAdapter implements StorageAdapter {
  private readonly objects = new Map<string, { body: Buffer; contentType: string }>();
  public shouldFail = false;
  public failureMessage = 'Simulated storage failure';

  public putCount = 0;
  public deleteCount = 0;

  isConfigured(): boolean {
    return true;
  }

  async putObject(params: { key: string; body: Buffer; contentType: string }): Promise<void> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }
    this.putCount++;
    this.objects.set(params.key, { body: params.body, contentType: params.contentType });
  }

  async deleteObject(key: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }
    this.deleteCount++;
    this.objects.delete(key);
  }

  hasObject(key: string): boolean {
    return this.objects.has(key);
  }

  getObject(key: string): { body: Buffer; contentType: string } | undefined {
    return this.objects.get(key);
  }

  clear(): void {
    this.objects.clear();
    this.shouldFail = false;
  }

  count(): number {
    return this.objects.size;
  }
}
