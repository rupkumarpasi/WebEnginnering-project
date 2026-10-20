import { ROLES } from '../services/users.service.js';
import { email, lowercase, oneOf, password, string } from './rules.js';

export const loginSchema = {
  email:    { required: true, check: email(), transform: lowercase },
  password: { required: true, check: string({ max: 72 }) }, // no strength rules on login — just "is it a string"
};

export const changePasswordSchema = {
  currentPassword: { required: true, check: string({ max: 72 }) },
  newPassword:     { required: true, check: password() },
};

export const changeRoleSchema = {
  role: { required: true, check: oneOf(ROLES) },
};