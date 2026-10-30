import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalDiskStorage } from '../../src/storage/local-disk.storage.js';
import { S3Storage } from '../../src/storage/s3.storage.js';

describe('LocalDiskStorage', () => {
  let dir;
  let storage;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'uploads-'));
    storage = new LocalDiskStorage({ dir, publicBaseUrl: 'http://localhost:3000' });
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('put → get → delete', async () => {
    const url = await storage.put('avatars/u1/v1-thumb.webp', Buffer.from('hello'));
    expect(url).toBe('http://localhost:3000/uploads/avatars/u1/v1-thumb.webp');
    expect((await storage.get('avatars/u1/v1-thumb.webp')).toString()).toBe('hello');

    await storage.delete('avatars/u1/v1-thumb.webp');
    await expect(storage.get('avatars/u1/v1-thumb.webp')).rejects.toMatchObject({ status: 404 });
  });

  it.each(['../../etc/passwd', 'avatars/../../secret', '/etc/passwd', 'a\\..\\b'])('refuses path traversal: %s', async (key) => {
    await expect(storage.put(key, Buffer.from('x'))).rejects.toMatchObject({ status: 400 });
  });

  it('has no presigned uploads (404 explains why)', async () => {
    await expect(storage.createPresignedUpload({})).rejects.toMatchObject({ status: 404 });
  });
});

describe('S3Storage presigned upload (signed locally — no network, no real AWS account)', () => {
  const s3 = new S3Storage({
    region: 'us-east-1',
    bucket: 'itex320-avatars',
    accessKeyId: 'AKIAEXAMPLEEXAMPLE00',
    secretAccessKey: 'example-secret-key-example-secret-key-00',
  });

  it('returns a signed PUT URL that expires and locks Content-Type and Content-Length', async () => {
    const upload = await s3.createPresignedUpload({ key: 'incoming/u1/abc', contentType: 'image/png', size: 12345 });
    const url = new URL(upload.url);

    expect(url.hostname).toBe('itex320-avatars.s3.us-east-1.amazonaws.com');
    expect(url.pathname).toBe('/incoming/u1/abc');
    expect(url.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
    expect(url.searchParams.get('X-Amz-SignedHeaders').split(';')).toEqual(
      expect.arrayContaining(['content-length', 'content-type', 'host']),
    );
    expect(upload).toMatchObject({ method: 'PUT', headers: { 'Content-Type': 'image/png', 'Content-Length': '12345' } });
    expect(upload.url).not.toContain('example-secret-key'); // the secret itself is never in the URL
  });

  it('builds public URLs for stored objects', () => {
    expect(s3.urlFor('avatars/u1/v-thumb.webp')).toBe('https://itex320-avatars.s3.us-east-1.amazonaws.com/avatars/u1/v-thumb.webp');
  });
});