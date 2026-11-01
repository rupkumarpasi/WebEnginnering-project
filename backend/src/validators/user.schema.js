import { z } from 'zod';

// Names: letters (any language), spaces, apostrophes, dots and hyphens — so "<script>" can't get in.
// This is ALLOW-listing: describe what is valid instead of trying to list every bad character.
const name = z
  .string()
  .trim()
  .min(1, 'must not be empty')
  .max(50)
  .regex(/^[\p{L}\p{M}' .-]+$/u, 'may only contain letters, spaces, apostrophes, dots and hyphens');

const email = z.string().trim().toLowerCase().max(254).pipe(z.email('must be a valid email address'));

const password = z
  .string()
  .min(8, 'must be 8-72 characters long')
  .max(72, 'must be 8-72 characters long')
  .regex(/[A-Za-z]/, 'must contain at least one letter')
  .regex(/\d/, 'must contain at least one digit');

const phone = z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,19}$/, 'must be a valid phone number, e.g. +977-9800000000');

const pastDate = z.iso
  .date('must be a real date in YYYY-MM-DD format')
  .refine((value) => new Date(value) < new Date(), 'must be in the past');

const text = (max) => z.string().trim().min(1, 'must not be empty').max(max);

// strictObject = unknown keys are an ERROR (stops mass assignment like { "role": "admin" }).
const address = z.strictObject({
  street: text(120),
  city: text(80),
  postalCode: text(20).optional(),
  country: text(80),
});

export const createUserSchema = z.strictObject({
  firstName: name,
  lastName: name,
  email,
  password,
  phone: phone.optional(),
  dateOfBirth: pastDate.optional(),
  address: address.optional(),
});

// PATCH: every field optional, password not allowed here, and at least one field required.
export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update');

export { email, password };
