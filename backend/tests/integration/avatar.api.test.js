import { randomBytes } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeImage, SVG_WITH_SCRIPT } from '../fakes/images.js';
import { MemoryStorage } from '../fakes/memory.storage.js';
import { bearer, buildTestApp, RAM, registerAs, SITA } from '../helpers.js';

const avatarUrl = (id) => `/api/v1/users/${id}/avatar`;

describe('Avatar upload with Multer + Sharp (local disk storage)', () => {
  let app;
  let dir;
  let sita;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'uploads-'));
    ({ app } = await buildTestApp({ uploads: { driver: 'local', localDir: dir, publicBaseUrl: '', maxBytes: 1024 * 1024 } }));
    sita = await registerAs(app, SITA);
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  const upload = (buffer, { filename = 'me.png', contentType = 'image/png', field = 'avatar', token = sita.token, id = sita.user.id } = {}) =>
    request(app).post(avatarUrl(id)).set(bearer(token)).attach(field, buffer, { filename, contentType });

  it('200: stores 3 WebP sizes and returns their URLs on the user', async () => {
    const res = await upload(await makeImage({ format: 'png' }));

    expect(res.status).toBe(200);
    const { avatar } = res.body.data;
    expect(avatar).toMatchObject({
      version: expect.any(String),
      thumb: expect.stringMatching(/^\/uploads\/avatars\/.+-thumb\.webp$/),
      small: expect.stringMatching(/-small\.webp$/),
      medium: expect.stringMatching(/-medium\.webp$/),
    });

    // The files are really served as static WebP images
    const file = await request(app).get(avatar.thumb);
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toBe('image/webp');
    expect(file.headers['x-content-type-options']).toBe('nosniff');
    expect((await sharp(file.body).metadata()).width).toBe(64);
  });

  it('uploading again replaces the old files (no orphans on disk)', async () => {
    await upload(await makeImage());
    await upload(await makeImage({ format: 'jpeg' }));
    const files = await readdir(path.join(dir, 'avatars', sita.user.id));
    expect(files).toHaveLength(3);
  });

  it('DELETE removes the avatar and its files', async () => {
    await upload(await makeImage());
    const res = await request(app).delete(avatarUrl(sita.user.id)).set(bearer(sita.token));
    expect(res.status).toBe(200);
    expect(res.body.data.avatar).toBeNull();
    expect(await readdir(path.join(dir, 'avatars', sita.user.id))).toHaveLength(0);
  });

  describe('rejections', () => {
    it('401 without a token, 403 for someone else’s avatar', async () => {
      const ram = await registerAs(app, RAM);
      expect((await request(app).post(avatarUrl(sita.user.id)).attach('avatar', await makeImage(), 'a.png')).status).toBe(401);
      expect((await upload(await makeImage(), { token: ram.token })).status).toBe(403);
    });

    it('413 when the file is larger than the limit', async () => {
      const big = randomBytes(1024 * 1024 + 1); // 1 byte over the 1 MB test limit
      const res = await upload(big); // Multer stops reading at the limit — Sharp never sees it
      expect(res.status).toBe(413);
    });

    it('415 for a declared type that is not an image', async () => {
      const res = await upload(Buffer.from('%PDF-1.7'), { filename: 'cv.pdf', contentType: 'application/pdf' });
      expect(res.status).toBe(415);
    });

    it('400 for a fake "PNG" (right Content-Type, wrong bytes)', async () => {
      const res = await upload(Buffer.from('<?php system($_GET["cmd"]); ?>'), { filename: 'shell.png', contentType: 'image/png' });
      expect(res.status).toBe(400);
      expect(res.body.detail).toBe('The uploaded file is not a valid image');
    });

    it('415 for SVG disguised as PNG', async () => {
      expect((await upload(SVG_WITH_SCRIPT, { filename: 'x.png' })).status).toBe(415);
    });

    it('400 when the field name is wrong or no file is sent', async () => {
      expect((await upload(await makeImage(), { field: 'photo' })).status).toBe(400);
      const noFile = await request(app).post(avatarUrl(sita.user.id)).set(bearer(sita.token)).field('note', 'hi');
      expect(noFile.status).toBe(400);
    });

    it('presign returns 404 on local storage (needs S3)', async () => {
      const res = await request(app).post(`${avatarUrl(sita.user.id)}/presign`).set(bearer(sita.token)).send({ contentType: 'image/png', size: 1000 });
      expect(res.status).toBe(404);
    });
  });
});

describe('Direct-to-S3 upload with presigned URLs (S3 replaced by MemoryStorage)', () => {
  let app;
  let storage;
  let sita;

  beforeEach(async () => {
    storage = new MemoryStorage();
    ({ app } = await buildTestApp({ storage, uploads: { driver: 's3', maxBytes: 1024 * 1024 } }));
    sita = await registerAs(app, SITA);
  });

  it('presign → (browser uploads to S3) → complete → avatar processed, original deleted', async () => {
    // Step 1: ask for a signed URL
    const presign = await request(app)
      .post(`${avatarUrl(sita.user.id)}/presign`)
      .set(bearer(sita.token))
      .send({ contentType: 'image/png', size: 5000 });
    expect(presign.status).toBe(201);
    const { key, url, method, headers } = presign.body.data;
    expect(key).toMatch(new RegExp(`^incoming/${sita.user.id}/`));
    expect(url).toContain('X-Amz-Signature');
    expect(method).toBe('PUT');
    expect(headers['Content-Type']).toBe('image/png');

    // Step 2: the browser PUTs the file to `url` — simulated here
    await storage.put(key, await makeImage(), 'image/png');

    // Step 3: tell the API the upload is done
    const complete = await request(app).post(`${avatarUrl(sita.user.id)}/complete`).set(bearer(sita.token)).send({ key });
    expect(complete.status).toBe(200);
    expect(complete.body.data.avatar.medium).toMatch(/^https:\/\/bucket\.example\.com\/avatars\/.+-medium\.webp$/);
    expect(storage.files.has(key)).toBe(false); // raw original removed
  });

  it('415 / 413 for bad presign requests', async () => {
    const url = `${avatarUrl(sita.user.id)}/presign`;
    expect((await request(app).post(url).set(bearer(sita.token)).send({ contentType: 'image/svg+xml', size: 100 })).status).toBe(415);
    expect((await request(app).post(url).set(bearer(sita.token)).send({ contentType: 'image/png', size: 5 * 1024 * 1024 })).status).toBe(413);
  });

  it('403 when completing an upload key that belongs to another user', async () => {
    const res = await request(app)
      .post(`${avatarUrl(sita.user.id)}/complete`)
      .set(bearer(sita.token))
      .send({ key: 'incoming/some-other-user/abc' });
    expect(res.status).toBe(403);
  });

  it('400 and cleanup when the uploaded object is not an image', async () => {
    const { body } = await request(app).post(`${avatarUrl(sita.user.id)}/presign`).set(bearer(sita.token)).send({ contentType: 'image/png', size: 20 });
    await storage.put(body.data.key, Buffer.from('not really an image'), 'image/png');

    const res = await request(app).post(`${avatarUrl(sita.user.id)}/complete`).set(bearer(sita.token)).send({ key: body.data.key });
    expect(res.status).toBe(400);
    expect(storage.files.has(body.data.key)).toBe(false);
  });
});