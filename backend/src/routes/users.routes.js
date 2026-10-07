import { Router } from 'express';
import { validateBody } from '../middleware/validate-body.js';
import { createUserSchema, updateUserSchema } from '../validators/user.schema.js';
import {validateIdParam} from "../middleware/validate-id.js"


export function createUsersRouter(controller) {

 const usersRouter = Router();

usersRouter.param('id',validateIdParam);

usersRouter.get('/', controller.list);
usersRouter.get('/:id', controller.getById);
usersRouter.post('/', validateBody(createUserSchema), controller.create);
usersRouter.patch('/:id', validateBody(updateUserSchema, { partial: true }), controller.update);
usersRouter.delete('/:id', controller.remove);
return usersRouter;

}