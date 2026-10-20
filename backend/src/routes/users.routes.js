import { Router } from 'express';
import { requirePermission, requireRole } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validate-body.js';
import { validateIdParam } from '../middleware/validate-id.js';
import { changeRoleSchema } from '../validators/auth.schema.js';
import { createUserSchema, updateUserSchema } from '../validators/user.schema.js';

export function createUsersRouter({ usersController: c, authenticate }) {
  const router = Router();

  router.use(authenticate); // every /users route needs a valid access token (401 otherwise)
  router.param('id', validateIdParam);

  //                 ┌── who may do it ───────────────────┐
  router.get('/',        requireRole('admin'),                                                     c.list);
  router.post('/',       requireRole('admin'),         validateBody(createUserSchema),             c.create);
  router.get('/:id',     requirePermission('users:read'),                                          c.getById);
  router.patch('/:id',   requirePermission('users:update'), validateBody(updateUserSchema, { partial: true }), c.update);
  router.patch('/:id/role', requireRole('admin'),      validateBody(changeRoleSchema),             c.changeRole);
  router.delete('/:id',  requirePermission('users:delete'),                                        c.remove);

  return router;
}