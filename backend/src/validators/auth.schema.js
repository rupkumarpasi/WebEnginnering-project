import { z } from 'zod';
import { ROLES } from '../services/users.service.js';
import { email, password } from './user.schema.js';

export const loginSchema = z.strictObject({
  email,
  password: z.string().min(1).max(72), // no strength rules on login — just "is it a string"
});

export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1).max(72),
  newPassword: password,
});

export const changeRoleSchema = z.strictObject({
  role: z.enum(ROLES),
});