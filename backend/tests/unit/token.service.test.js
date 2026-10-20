import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it } from 'vitest';
import { RefreshTokensRepository } from '../../src/repositories/refresh-tokens.repository.js';
import { TokenService } from '../../src/services/token.service.js';

const OPTIONS = {
  jwtSecret: 'unit-test-secret-unit-test-secret-1234',
  accessTokenTtlSeconds: 900,
  refreshTokenTtlDays: 7,
  issuer: 'users-api',
  audience: 'users-api',
};
const user = { id: 'user-1', role: 'customer' };

describe('TokenService', () => {
  let repo;
  let tokens;

  beforeEach(() => {
    repo = new RefreshTokensRepository();
    tokens = new TokenService(repo, OPTIONS);
  });

  describe('access tokens (JWT)', () => {
    it('round-trips id and role', () => {
      const token = tokens.signAccessToken(user);
      expect(tokens.verifyAccessToken(token)).toEqual({ id: 'user-1', role: 'customer' });
    });

    it('contains sub, role, iss, aud, exp — and nothing secret', () => {
      const payload = jwt.decode(tokens.signAccessToken(user)); // decode WITHOUT verifying: anyone can do this!
      expect(payload).toMatchObject({ sub: 'user-1', role: 'customer', iss: 'users-api', aud: 'users-api' });
      expect(payload.exp - payload.iat).toBe(900);
      expect(Object.keys(payload).sort()).toEqual(['aud', 'exp', 'iat', 'iss', 'role', 'sub']);
    });

    it('rejects a token signed with a different secret', () => {
      const forged = jwt.sign({ role: 'admin' }, 'attacker-secret', { subject: 'user-1', issuer: 'users-api', audience: 'users-api' });
      expect(() => tokens.verifyAccessToken(forged)).toThrow('Invalid access token');
    });

    it('rejects an unsigned "alg: none" token', () => {
      const unsigned = jwt.sign({ role: 'admin' }, null, { algorithm: 'none', subject: 'user-1', issuer: 'users-api', audience: 'users-api' });
      expect(() => tokens.verifyAccessToken(unsigned)).toThrow('Invalid access token');
    });

    it('rejects an expired token with a clear message', () => {
      const expired = jwt.sign({ role: 'customer', exp: Math.floor(Date.now() / 1000) - 10 }, OPTIONS.jwtSecret, {
        subject: 'user-1', issuer: 'users-api', audience: 'users-api',
      });
      expect(() => tokens.verifyAccessToken(expired)).toThrow('Access token expired');
    });

    it('rejects a tampered payload (role changed to admin)', () => {
      const [header, , signature] = tokens.signAccessToken(user).split('.');
      const evilPayload = Buffer.from(JSON.stringify({ sub: 'user-1', role: 'admin', iss: 'users-api', aud: 'users-api', exp: 9999999999 })).toString('base64url');
      expect(() => tokens.verifyAccessToken(`${header}.${evilPayload}.${signature}`)).toThrow('Invalid access token');
    });
  });

  describe('refresh tokens', () => {
    it('stores only a SHA-256 hash, never the token itself', async () => {
      const { token } = await tokens.issueRefreshToken('user-1');
      const [row] = await repo.findAll();
      expect(row.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(JSON.stringify(row)).not.toContain(token);
    });

    it('rotation: returns a NEW token and revokes the old one', async () => {
      const first = await tokens.issueRefreshToken('user-1');
      const { userId, refresh: second } = await tokens.rotateRefreshToken(first.token);

      expect(userId).toBe('user-1');
      expect(second.token).not.toBe(first.token);
      const old = await repo.findById(first.id);
      expect(old.revokedAt).not.toBeNull();
      expect(old.replacedBy).toBe(second.id);
    });

    it('reuse detection: replaying an old token revokes the whole family', async () => {
      const first = await tokens.issueRefreshToken('user-1');
      const { refresh: second } = await tokens.rotateRefreshToken(first.token);

      await expect(tokens.rotateRefreshToken(first.token)).rejects.toMatchObject({ status: 401, detail: expect.stringMatching(/reuse detected/) });
      // The legitimate newer token is now dead too.
      await expect(tokens.rotateRefreshToken(second.token)).rejects.toMatchObject({ status: 401 });
    });

    it('rejects unknown and expired tokens', async () => {
      await expect(tokens.rotateRefreshToken('made-up')).rejects.toMatchObject({ status: 401 });
      await expect(tokens.rotateRefreshToken(undefined)).rejects.toMatchObject({ status: 401 });

      const shortLived = new TokenService(repo, { ...OPTIONS, refreshTokenTtlDays: -1 });
      const { token } = await shortLived.issueRefreshToken('user-1');
      await expect(shortLived.rotateRefreshToken(token)).rejects.toMatchObject({ detail: 'Refresh token expired' });
    });

    it('revokeAllForUser logs out every device', async () => {
      const a = await tokens.issueRefreshToken('user-1');
      const b = await tokens.issueRefreshToken('user-1');
      const other = await tokens.issueRefreshToken('user-2');

      await tokens.revokeAllForUser('user-1');

      await expect(tokens.rotateRefreshToken(a.token)).rejects.toMatchObject({ status: 401 });
      await expect(tokens.rotateRefreshToken(b.token)).rejects.toMatchObject({ status: 401 });
      await expect(tokens.rotateRefreshToken(other.token)).resolves.toBeDefined();
    });
  });
});