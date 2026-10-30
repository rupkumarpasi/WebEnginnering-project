import multer from 'multer';
import { badRequest, HttpError } from '../utils/http-error.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

/**
 * Multer parses multipart/form-data. We keep the file in MEMORY (a Buffer) because Sharp
 * processes it straight away; nothing unprocessed is ever written to disk.
 * The limits stop abuse before the whole body is read.
 */
export function createImageUpload({ fieldName, maxBytes }) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: 5, parts: 6 },
    fileFilter(req, file, cb) {
      // A first, cheap check on the declared type. The REAL check (magic bytes) happens in ImageService.
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(new HttpError(415, 'Unsupported Media Type', `File type ${file.mimetype} is not allowed`));
      }
      cb(null, true);
    },
  }).single(fieldName);

  return function imageUpload(req, res, next) {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new HttpError(413, 'Content Too Large', `File is larger than ${maxBytes} bytes`));
        }
        return next(badRequest(`Upload error: ${err.message}`)); // e.g. unexpected field name
      }
      if (err) return next(err);
      if (!req.file) return next(badRequest(`Send the image as multipart/form-data in a field named "${fieldName}"`));
      next();
    });
  };
}