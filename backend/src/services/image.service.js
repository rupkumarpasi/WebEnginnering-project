import sharp from 'sharp';
import { badRequest, HttpError } from '../utils/http-error.js';

// Formats we accept as INPUT. Notice: no SVG — SVG is XML and can contain <script>.
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'avif']);

// Refuse "decompression bombs": a tiny file that decodes to a gigantic image and eats all RAM.
const MAX_PIXELS = 40_000_000; // e.g. 8000 x 5000

export const AVATAR_VARIANTS = [
  { name: 'thumb', size: 64 },
  { name: 'small', size: 256 },
  { name: 'medium', size: 512 },
];

export class ImageService {
  // Never trust the file name or the Content-Type header — look at the actual bytes.
  async inspect(buffer) {
    let meta;
    try {
      meta = await sharp(buffer, { limitInputPixels: MAX_PIXELS }).metadata();
    } catch {
      throw badRequest('The uploaded file is not a valid image');
    }
    if (!ALLOWED_FORMATS.has(meta.format)) {
      throw new HttpError(415, 'Unsupported Media Type', `Image format "${meta.format}" is not allowed`);
    }
    if (meta.width * meta.height > MAX_PIXELS) throw badRequest('Image dimensions are too large');
    return meta;
  }

  /**
   * The pipeline, for each variant:
   *   rotate()  → apply the EXIF orientation (phone photos are often stored sideways)
   *   resize()  → square crop, "attention" keeps the most interesting part (usually the face)
   *   webp()    → modern format, ~30% smaller than JPEG at the same quality
   * Sharp drops ALL metadata by default, so GPS location and camera info never leak.
   * Sharp runs on libuv's thread pool, so this does NOT block the event loop.
   */
  async createAvatarVariants(buffer) {
    await this.inspect(buffer);
    return Promise.all(
      AVATAR_VARIANTS.map(async ({ name, size }) => ({
        name,
        size,
        contentType: 'image/webp',
        buffer: await sharp(buffer, { limitInputPixels: MAX_PIXELS })
          .rotate()
          .resize(size, size, { fit: 'cover', position: 'attention' })
          .webp({ quality: 80 })
          .toBuffer(),
      })),
    );
  }
}
