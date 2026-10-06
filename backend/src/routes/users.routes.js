import { Router } from 'express';
import { UsersController } from '../controllers/users.controller.js';
import { validateBody } from '../middleware/validate-body.js';
import { createUserSchema, updateUserSchema } from '../validators/user.schema.js';

const controller = new UsersController();

export const usersRouter = Router();

usersRouter.get('/', controller.list);
usersRouter.get('/:id', controller.getById);
usersRouter.post('/', validateBody(createUserSchema), controller.create);
usersRouter.patch('/:id', validateBody(updateUserSchema, { partial: true }), controller.update);
usersRouter.delete('/:id', controller.remove);
