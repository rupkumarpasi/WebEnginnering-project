import { badRequest } from '../utils/http-error.js';

// Turn Zod issues into our { field, message } error list (same shape as before 2.5).
function toFieldErrors(issues) {
  return issues.flatMap((issue) =>
    issue.code === 'unrecognized_keys'
      ? issue.keys.map((key) => ({ field: [...issue.path, key].join('.'), message: 'is not allowed' }))
      : [{ field: issue.path.join('.') || '(body)', message: issue.message }],
  );
}

// Route-level middleware: parse req.body with a Zod schema. On success req.body is REPLACED by the
// parsed data — trimmed, lower-cased, and containing only the fields the schema knows about.
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return next(badRequest('Request body failed validation', toFieldErrors(result.error.issues)));
  req.body = result.data;
  next();
};