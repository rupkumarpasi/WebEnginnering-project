import { badRequest } from '../utils/http-error.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Param middleware: runs for every route that has :id, BEFORE the route handler.
// Signature has a 4th argument — the value of the parameter.
export function validateIdParam(req, res, next, id) {
  if (!UUID_PATTERN.test(id)) return next(badRequest('id must be a valid UUID'));
  next();
}