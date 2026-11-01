import { Router } from 'express';
import { validateBody } from '../middleware/validate-body.js';
import { changePasswordSchema, loginSchema } from '../validators/auth.schema.js';
import { createUserSchema } from '../validators/user.schema.js';

export function createAuthRouter({ authController: c, authenticate, authRateLimit, verifyOrigin }) {
  const router = Router();

  // Public
  router.post('/register', authRateLimit, validateBody(createUserSchema), c.register);
  router.post('/login', authRateLimit, validateBody(loginSchema), c.login);
  router.post('/refresh', verifyOrigin, c.refresh); // cookie-authenticated → CSRF check
  router.post('/logout', verifyOrigin, c.logout);
  router.get('/github', c.githubStart);
  router.get('/github/callback', c.githubCallback);

  // Logged-in users
  router.get('/me', authenticate, c.me);
  router.patch('/password', authenticate, validateBody(changePasswordSchema), c.changePassword);

  return router;
}