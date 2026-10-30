import { randomUUID } from 'node:crypto';
import { AVATAR_VARIANTS } from './image.service.js';
import { badRequest, forbidden, HttpError } from '../utils/http-error.js';

export const DIRECT_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const keyFor = (userId, version, name) => `avatars/${userId}/${version}-${name}.webp`;

export class AvatarService {
  constructor(usersService, imageService, storage, { maxBytes }) {
    this.users = usersService;
    this.images = imageService;
    this.storage = storage;
    this.maxBytes = maxBytes;
  }

  // Process an image buffer, store 3 WebP sizes, point the user at them, delete the old ones.
  async setAvatar(userId, buffer) {
    const before = await this.users.getById(userId); // 404 if the user doesn't exist
    const variants = await this.images.createAvatarVariants(buffer);

    // A new random "version" per upload gives new URLs, so browsers/CDNs never show a stale image.
    const version = randomUUID();
    const avatar = { version };
    for (const variant of variants) {
      avatar[variant.name] = await this.storage.put(keyFor(userId, version, variant.name), variant.buffer, variant.contentType);
    }

    const user = await this.users.setAvatar(userId, avatar);
    if (before.avatar) await this.#deleteFiles(userId, before.avatar.version);
    return user;
  }

  async removeAvatar(userId) {
    const user = await this.users.getById(userId);
    if (user.avatar) await this.#deleteFiles(userId, user.avatar.version);
    return this.users.setAvatar(userId, null);
  }

  // ── Direct-to-S3 uploads with presigned URLs ──

  // Step 1: the client says what it wants to upload; we answer with a short-lived signed URL.
  async createDirectUpload(userId, { contentType, size }) {
    if (!DIRECT_UPLOAD_TYPES.includes(contentType)) {
      throw new HttpError(415, 'Unsupported Media Type', `contentType must be one of: ${DIRECT_UPLOAD_TYPES.join(', ')}`);
    }
    if (size > this.maxBytes) throw new HttpError(413, 'Content Too Large', `Maximum size is ${this.maxBytes} bytes`);

    const key = `incoming/${userId}/${randomUUID()}`;
    const upload = await this.storage.createPresignedUpload({ key, contentType, size });
    return { key, ...upload };
  }

  // Step 3: after the browser uploaded to S3, the client tells us the key; we fetch, process, clean up.
  async completeDirectUpload(userId, key) {
    // ABAC again: you may only finish uploads that were issued for YOUR user id.
    if (!key.startsWith(`incoming/${userId}/`)) throw forbidden('This upload does not belong to you');
    const buffer = await this.storage.get(key);
    if (buffer.length > this.maxBytes) throw badRequest('Uploaded file is too large');
    try {
      return await this.setAvatar(userId, buffer);
    } finally {
      await this.storage.delete(key); // the raw original is never kept
    }
  }

  async #deleteFiles(userId, version) {
    await Promise.all(AVATAR_VARIANTS.map(({ name }) => this.storage.delete(keyFor(userId, version, name))));
  }
}
