import crypto from 'node:crypto';

export interface EncryptedPayloadEnvelope {
  v: 1;
  iv: string; // base64
  tag: string; // base64
  ciphertext: string; // base64
}

export function encryptPayload(data: unknown, key: Buffer): EncryptedPayloadEnvelope {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new Error('Encryption key must be a 32-byte Buffer');
  }
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    v: 1,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

export function decryptPayload<T = unknown>(envelope: unknown, key: Buffer): T {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new Error('DECRYPTION_FAILURE: Key must be a 32-byte Buffer');
  }
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('DECRYPTION_FAILURE: Invalid envelope');
  }
  const env = envelope as Partial<EncryptedPayloadEnvelope>;
  if (env.v !== 1 || !env.iv || !env.tag || !env.ciphertext) {
    throw new Error('DECRYPTION_FAILURE: Incompatible envelope structure');
  }

  const iv = Buffer.from(env.iv, 'base64');
  const tag = Buffer.from(env.tag, 'base64');
  const ciphertext = Buffer.from(env.ciphertext, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8')) as T;
}
