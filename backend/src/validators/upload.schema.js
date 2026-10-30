import { integer, string } from './rules.js';

export const presignSchema = {
  contentType: { required: true, check: string({ max: 50 }) },
  size: { required: true, check: integer({ min: 1, max: 50 * 1024 * 1024 }) },
};

export const completeUploadSchema = {
  key: { required: true, check: string({ max: 200 }) },
};