import { HttpError } from '../utils/http-error.js';

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH']);

// A request "has a body" if it is chunked or declares a non-zero Content-Length.
// POST /auth/refresh and /auth/logout have NO body, so they must be allowed through.
const hasBody = (req) =>
  req.get('transfer-encoding') !== undefined || Number(req.get('content-length') ?? 0) > 0;

// App-level middleware: requests that carry a body MUST be JSON.
export function requireJson(req, res, next) {
  if (METHODS_WITH_BODY.has(req.method) && hasBody(req) && !req.is('application/json')) {
    return next(new HttpError(415, 'Unsupported Media Type', 'Content-Type must be application/json'));
  }
  next();
}