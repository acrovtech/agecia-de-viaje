export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');

export interface StorageAdapter {
  /**
   * Uploads an object buffer with the given key and content type.
   */
  putObject(params: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<void>;

  /**
   * Deletes an object by key.
   */
  deleteObject(key: string): Promise<void>;

  /**
   * Checks whether the underlying storage provider is configured and available.
   */
  isConfigured(): boolean;
}
