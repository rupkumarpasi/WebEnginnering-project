import { describe, expect, it } from 'vitest';
import { loginSchema } from '../../src/validators/auth.schema.js';
import { createUserSchema, updateUserSchema } from '../../src/validators/user.schema.js';

const valid = {
  firstName: 'Sita',
  lastName: "O'Brien-Gurung",
  email: '  Sita@Example.COM ',
  password: 'Secret123',
  address: { street: 'Lakeside Road 5', city: 'Pokhara', country: 'Nepal' },
};

// Helper: the list of field paths Zod complained about.
const errorPaths = (schema, body) => schema.safeParse(body).error?.issues.map((i) => i.path.join('.') || i.code) ?? [];

describe('createUserSchema (Zod)', () => {
  it('accepts valid input and normalises it (trim + lower-case email)', () => {
    const result = createUserSchema.parse(valid);
    expect(result.email).toBe('sita@example.com');
    expect(result.lastName).toBe("O'Brien-Gurung");
  });

  it('accepts names in any language', () => {
    expect(createUserSchema.safeParse({ ...valid, firstName: 'सीता', lastName: 'Łukasz' }).success).toBe(true);
  });

  it.each([
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    'Robert"); DROP TABLE users;--',
    '{{7*7}}',
  ])('rejects XSS / injection payloads in names: %s', (payload) => {
    expect(errorPaths(createUserSchema, { ...valid, firstName: payload })).toEqual(['firstName']);
  });

  it('rejects NoSQL operator objects instead of strings', () => {
    expect(errorPaths(createUserSchema, { ...valid, email: { $ne: null } })).toEqual(['email']);
  });

  it('rejects unknown keys, including __proto__ (prototype pollution) and role (mass assignment)', () => {
    const body = JSON.parse('{"firstName":"Sita","lastName":"G","email":"s@x.co","password":"Secret123","__proto__":{"isAdmin":true},"role":"admin"}');
    const issue = createUserSchema.safeParse(body).error.issues[0];
    expect(issue.code).toBe('unrecognized_keys');
    expect(issue.keys).toEqual(['__proto__', 'role']);
  });

  it('checks nested address fields and impossible dates', () => {
    expect(errorPaths(createUserSchema, { ...valid, address: { street: 'x', country: 'Nepal' } })).toEqual(['address.city']);
    expect(errorPaths(createUserSchema, { ...valid, dateOfBirth: '2001-02-29' })).toEqual(['dateOfBirth']);
    expect(errorPaths(createUserSchema, { ...valid, dateOfBirth: '2999-01-01' })).toEqual(['dateOfBirth']);
  });

  it('enforces password strength', () => {
    expect(errorPaths(createUserSchema, { ...valid, password: 'short1' })).toEqual(['password']);
    expect(errorPaths(createUserSchema, { ...valid, password: 'onlyletters' })).toEqual(['password']);
  });
});

describe('updateUserSchema', () => {
  it('allows partial updates but not an empty body or a password', () => {
    expect(updateUserSchema.safeParse({ phone: '+977-9811111111' }).success).toBe(true);
    expect(updateUserSchema.safeParse({}).success).toBe(false);
    expect(updateUserSchema.safeParse({ password: 'NewPass123' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('rejects the classic NoSQL login bypass { "$ne": null }', () => {
    const result = loginSchema.safeParse({ email: { $ne: null }, password: { $ne: null } });
    expect(result.success).toBe(false);
    expect(result.error.issues.map((i) => i.path[0])).toEqual(['email', 'password']);
  });
});