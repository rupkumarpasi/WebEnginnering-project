import { Router } from 'express';
import { validateBody } from '../middleware/validate-body.js';
import { changePasswordSchema, loginSchema } from '../validators/auth.schema.js';
import { createUserSchema } from '../validators/user.schema.js';

export function createAuthRouter({ authController: c, authenticate }) {
  const router = Router();

  // Public
  router.post('/register', validateBody(createUserSchema), c.register);
  router.post('/login', validateBody(loginSchema), c.login);
  router.post('/refresh', c.refresh); // reads the httpOnly refresh cookie
  router.post('/logout', c.logout);
  router.get('/github', c.githubStart);
  router.get('/github/callback', c.githubCallback);

  // Logged-in users
  router.get('/me', authenticate, c.me);
  router.patch('/password', authenticate, validateBody(changePasswordSchema), c.changePassword);
  router.post("/password",authenticate,c.setPassword);

  return router;
}