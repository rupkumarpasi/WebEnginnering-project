import { describe, expect, it, vi } from 'vitest';
import { can } from '../../src/auth/policies.js';
import { createAuthenticate } from '../../src/middleware/authenticate.js';
import { requirePermission, requireRole } from '../../src/middleware/authorize.js';
import { unauthorized } from '../../src/utils/http-error.js';

const admin = { id: 'a1', role: 'admin' };
const sita = { id: 's1', role: 'customer' };
const ram = { id: 'r1', role: 'customer' };

describe('ABAC policies: can(actor, action, resource)', () => {
  it.each([
    // actor, action, resource, expected
    [sita, 'users:read', { id: 's1' }, true], // own profile
    [sita, 'users:read', { id: 'r1' }, false], // someone else
    [admin, 'users:read', { id: 'r1' }, true],
    [sita, 'users:update', { id: 's1' }, true],
    [ram, 'users:update', { id: 's1' }, false],
    [admin, 'users:delete', { id: 's1' }, true],
    [admin, 'users:delete', { id: 'a1' }, false], // admins can't delete themselves
    [sita, 'users:delete', { id: 's1' }, false], // customers can't delete, even themselves
  ])('%o %s %o → %s', (actor, action, resource, expected) => {
    expect(can(actor, action, resource)).toBe(expected);
  });

  it('denies when there is no actor', () => {
    expect(can(undefined, 'users:read', { id: 's1' })).toBe(false);
  });

  it('throws on an unknown action instead of silently allowing', () => {
    expect(() => can(admin, 'users:destroy-everything', {})).toThrow(/Unknown action/);
  });
});

describe('requireRole (RBAC middleware)', () => {
  it('allows a matching role', () => {
    const next = vi.fn();
    requireRole('admin')({ user: admin }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('403s any other role', () => {
    const next = vi.fn();
    requireRole('admin')({ user: sita }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 403 });
  });
});

describe('requirePermission (ABAC middleware)', () => {
  it('uses req.params.id as the resource by default', () => {
    const next = vi.fn();
    requirePermission('users:read')({ user: sita, params: { id: 's1' } }, {}, next);
    expect(next).toHaveBeenCalledWith();

    const next2 = vi.fn();
    requirePermission('users:read')({ user: sita, params: { id: 'r1' } }, {}, next2);
    expect(next2.mock.calls[0][0]).toMatchObject({ status: 403 });
  });
});

describe('authenticate middleware', () => {
  const tokenService = {
    verifyAccessToken: vi.fn((token) => {
      if (token === 'good') return { id: 's1', role: 'customer' };
      throw unauthorized('Invalid access token');
    }),
  };
  const authenticate = createAuthenticate(tokenService);
  const run = (authorization) => {
    const req = { get: () => authorization };
    const res = { set: vi.fn() };
    const next = vi.fn();
    authenticate(req, res, next);
    return { req, res, next };
  };

  it('sets req.user for a valid Bearer token', () => {
    const { req, next } = run('Bearer good');
    expect(req.user).toEqual({ id: 's1', role: 'customer' });
    expect(next).toHaveBeenCalledWith();
  });

  it.each([undefined, '', 'Basic abc', 'Bearer', 'good'])('401 + WWW-Authenticate for %j', (header) => {
    const { res, next } = run(header);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
    expect(res.set).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer');
  });

  it('401 for an invalid token', () => {
    const { res, next } = run('Bearer bad');
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, detail: 'Invalid access token' });
    expect(res.set).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer error="invalid_token"');
  });
});