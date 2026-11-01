import { z } from 'zod';

export const presignSchema = z.strictObject({
  contentType: z.string().max(50),
  size: z.int().min(1).max(50 * 1024 * 1024),
});

export const completeUploadSchema = z.strictObject({
  key: z.string().max(200),
});