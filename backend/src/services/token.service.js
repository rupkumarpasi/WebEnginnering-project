import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { unauthorized } from '../utils/http-error.js';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

/**
 * Two kinds of token:
 *  - ACCESS token: a short-lived signed JWT (15 min). Stateless — verified with the secret, no DB lookup.
 *  - REFRESH token: a long-lived random string (7 days). Stateful — stored (hashed) so it can be
 *    rotated on every use and revoked on logout / password change / theft.
 */
export class TokenService {
  constructor(refreshTokensRepository, { jwtSecret, accessTokenTtlSeconds, refreshTokenTtlDays, issuer, audience }) {
    this.refreshTokens = refreshTokensRepository;
    this.secret = jwtSecret;
    this.accessTokenTtlSeconds = accessTokenTtlSeconds;
    this.refreshTokenTtlMs = refreshTokenTtlDays * 24 * 60 * 60 * 1000;
    this.jwtOptions = { issuer, audience };
  }

  // Keep the payload small and non-sensitive: anyone can base64-decode a JWT.
  signAccessToken(user) {
    return jwt.sign({ role: user.role }, this.secret, {
      ...this.jwtOptions,
      subject: user.id,
      algorithm: 'HS256',
      expiresIn: this.accessTokenTtlSeconds,
    });
  }

  // Returns { id, role } or throws 401. `algorithms` is pinned to stop "alg: none" / algorithm-swap attacks.
  verifyAccessToken(token) {
    try {
      const payload = jwt.verify(token, this.secret, { ...this.jwtOptions, algorithms: ['HS256'] });
      return { id: payload.sub, role: payload.role };
    } catch (err) {
      throw unauthorized(err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token');
    }
  }

  async issueRefreshToken(userId, familyId = randomUUID()) {
    const token = randomBytes(32).toString('base64url');
    const row = await this.refreshTokens.create({
      userId,
      tokenHash: sha256(token),
      familyId, // all tokens produced by rotating one login share a family
      expiresAt: new Date(Date.now() + this.refreshTokenTtlMs).toISOString(),
      revokedAt: null,
      replacedBy: null,
    });
    return { token, id: row.id, expiresAt: row.expiresAt };
  }

  // Refresh-token ROTATION with REUSE DETECTION.
  async rotateRefreshToken(token) {
    const row = token ? await this.refreshTokens.findByHash(sha256(token)) : null;
    if (!row) throw unauthorized('Invalid refresh token');

    if (row.revokedAt) {
      // A token that was already used is being used AGAIN → it was probably stolen.
      // Kill the whole family so both the thief and the victim must log in again.
      await this.refreshTokens.revokeFamily(row.familyId);
      throw unauthorized('Refresh token reuse detected — please log in again');
    }
    if (new Date(row.expiresAt) <= new Date()) throw unauthorized('Refresh token expired');

    const next = await this.issueRefreshToken(row.userId, row.familyId);
    await this.refreshTokens.update(row.id, { revokedAt: new Date().toISOString(), replacedBy: next.id });
    return { userId: row.userId, refresh: next };
  }

  async revokeRefreshToken(token) {
    const row = token ? await this.refreshTokens.findByHash(sha256(token)) : null;
    if (row) await this.refreshTokens.revokeFamily(row.familyId);
  }

  revokeAllForUser(userId) {
    return this.refreshTokens.revokeAllForUser(userId);
  }
}