import {createCipheriv, createDecipheriv, randomBytes} from 'node:crypto';

const VERSION = 'v1';

function encryptionKey(raw: string): Buffer {
  const value = raw.trim();
  const bytes = /^[0-9a-f]{64}$/i.test(value)
    ? Buffer.from(value, 'hex')
    : Buffer.from(value, 'base64');
  if (bytes.length !== 32) throw new Error('AI credential encryption is not configured.');
  return bytes;
}

export function encryptCredential(plaintext: string, rawKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(rawKey), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join(':');
}

export function decryptCredential(payload: string, rawKey: string): string {
  const [version, ivRaw, tagRaw, encryptedRaw, extra] = payload.split(':');
  if (version !== VERSION || !ivRaw || !tagRaw || !encryptedRaw || extra !== undefined) {
    throw new Error('Stored AI credential is invalid.');
  }
  try {
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(rawKey), Buffer.from(ivRaw, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error('Stored AI credential could not be decrypted.');
  }
}
