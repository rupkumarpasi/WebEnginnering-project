import { HttpError } from '../utils/http-error.js';

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH']);
// JSON for normal requests, multipart/form-data for file uploads (Topic 2.4).
const ALLOWED_BODY_TYPES = ['application/json', 'multipart/form-data'];

// A request "has a body" if it is chunked or declares a non-zero Content-Length.
const hasBody = (req) =>
  req.get('transfer-encoding') !== undefined || Number(req.get('content-length') ?? 0) > 0;

export function requireJson(req, res, next) {
  if (METHODS_WITH_BODY.has(req.method) && hasBody(req) && !req.is(ALLOWED_BODY_TYPES)) {
    return next(new HttpError(415, 'Unsupported Media Type', 'Content-Type must be application/json (or multipart/form-data for uploads)'));
  }
  next();
}