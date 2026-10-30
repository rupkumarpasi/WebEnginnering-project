import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { ImageService } from '../../src/services/image.service.js';
import { makeImage, SVG_WITH_SCRIPT } from '../fakes/images.js';

const images = new ImageService();

describe('ImageService', () => {
  it('creates 3 square WebP variants: 64, 256 and 512 px', async () => {
    const variants = await images.createAvatarVariants(await makeImage({ width: 1200, height: 800, format: 'jpeg' }));

    expect(variants.map((v) => v.name)).toEqual(['thumb', 'small', 'medium']);
    for (const v of variants) {
      const meta = await sharp(v.buffer).metadata();
      expect(meta.format).toBe('webp');
      expect([meta.width, meta.height]).toEqual([v.size, v.size]);
      expect(v.contentType).toBe('image/webp');
    }
  });

  it('strips EXIF metadata (camera, GPS, ...) from the output', async () => {
    const input = await makeImage({ format: 'jpeg', exif: { IFD0: { Copyright: 'secret-camera-owner' } } });
    expect((await sharp(input).metadata()).exif).toBeDefined(); // input HAS exif

    const [thumb] = await images.createAvatarVariants(input);
    expect((await sharp(thumb.buffer).metadata()).exif).toBeUndefined();
  });

  it('compresses: the 512 px WebP is much smaller than a big PNG input', async () => {
    const input = await makeImage({ width: 2000, height: 2000, format: 'png' });
    const medium = (await images.createAvatarVariants(input)).find((v) => v.name === 'medium');
    expect(medium.buffer.length).toBeLessThan(input.length / 5);
  });

  it('rejects bytes that are not an image, whatever the file claims to be', async () => {
    await expect(images.createAvatarVariants(Buffer.from('I am a PDF pretending to be a PNG'))).rejects.toMatchObject({
      status: 400,
      detail: 'The uploaded file is not a valid image',
    });
  });

  it('rejects SVG (it can contain scripts) with 415', async () => {
    await expect(images.createAvatarVariants(SVG_WITH_SCRIPT)).rejects.toMatchObject({ status: 415 });
  });

  it('rejects decompression bombs (huge pixel dimensions)', async () => {
    const bomb = await sharp({ create: { width: 9000, height: 9000, channels: 3, background: '#000' } }).png().toBuffer();
    await expect(images.createAvatarVariants(bomb)).rejects.toMatchObject({ status: 400 });
  });
});
