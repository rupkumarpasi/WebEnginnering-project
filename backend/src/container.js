import { UsersController } from './controllers/users.controller.js';
import { UsersRepository } from './repositories/users.repository.js';
import { UsersService } from './services/users.service.js';

// Composition root: the ONE place where objects are created and wired together.
//   repository → service → controller
// `overrides` lets tests swap any piece (e.g. a fake password hasher or a fake service).
export function createContainer(overrides = {}) {
  const usersRepository = overrides.usersRepository ?? new UsersRepository();
  const usersService = overrides.usersService ?? new UsersService(usersRepository, { hash: overrides.hashPassword });
  const usersController = new UsersController(usersService);

  return { usersRepository, usersService, usersController };
}