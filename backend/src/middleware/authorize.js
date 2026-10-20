import { can } from '../auth/policies.js';
import { forbidden } from '../utils/http-error.js';

// Authorization = "WHAT are you allowed to do?"  Always runs AFTER authenticate.

// RBAC (Role-Based Access Control): allowed if the user's role is in the list.
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return next(forbidden(`Requires role: ${roles.join(' or ')}`));
  next();
};

// ABAC: allowed if the policy for `action` says yes for this actor + resource.
export const requirePermission = (action, getResource = (req) => ({ id: req.params.id })) => (req, res, next) => {
  if (!can(req.user, action, getResource(req))) return next(forbidden());
  next();
};