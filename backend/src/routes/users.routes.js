import { Router } from 'express';
import { requirePermission, requireRole } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validate-body.js';
import { validateIdParam } from '../middleware/validate-id.js';
import { changeRoleSchema } from '../validators/auth.schema.js';
import { completeUploadSchema, presignSchema } from '../validators/upload.schema.js';
import { createUserSchema, updateUserSchema } from '../validators/user.schema.js';

export function createUsersRouter({ usersController: c, avatarController: a, authenticate, avatarUpload }) {
  const router = Router();

  router.use(authenticate);
  router.param('id', validateIdParam);

  router.get('/',           requireRole('admin'),                                    c.list);
  router.post('/',          requireRole('admin'), validateBody(createUserSchema),    c.create);
  router.get('/:id',        requirePermission('users:read'),                         c.getById);
  router.patch('/:id',      requirePermission('users:update'), validateBody(updateUserSchema, { partial: true }), c.update);
  router.patch('/:id/role', requireRole('admin'), validateBody(changeRoleSchema),    c.changeRole);
  router.delete('/:id',     requirePermission('users:delete'),                       c.remove);

  // ── New in 2.4: avatars (same ABAC rule as editing the profile) ──
  router.post('/:id/avatar',          requirePermission('users:update'), avatarUpload,                       a.upload);
  router.delete('/:id/avatar',        requirePermission('users:update'),                                     a.remove);
  router.post('/:id/avatar/presign',  requirePermission('users:update'), validateBody(presignSchema),        a.presign);
  router.post('/:id/avatar/complete', requirePermission('users:update'), validateBody(completeUploadSchema), a.complete);

  return router;
}
