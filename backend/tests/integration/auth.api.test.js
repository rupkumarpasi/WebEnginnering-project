import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { ADMIN, bearer, buildTestApp, loginAs, registerAs, SITA } from '../helpers.js';

const AUTH = '/api/v1/auth';

describe('Auth API', () => {
  let app;

  beforeEach(async () => {
    ({ app } = await buildTestApp());
  });

  describe('POST /register', () => {
    it('201: creates a customer, returns an access token and sets an httpOnly refresh cookie', async () => {
      const res = await request(app).post(`${AUTH}/register`).send(SITA);

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ tokenType: 'Bearer', expiresIn: 900, user: { email: SITA.email, role: 'customer' } });
      expect(res.body.data.accessToken.split('.')).toHaveLength(3); // header.payload.signature
      expect(JSON.stringify(res.body)).not.toMatch(/password/i);

      const cookie = res.headers['set-cookie'].find((c) => c.startsWith('refresh_token='));
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Strict/);
      expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
    });

    it('400 if the client tries to register as admin', async () => {
      const res = await request(app).post(`${AUTH}/register`).send({ ...SITA, role: 'admin' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /login', () => {
    it('200 with correct credentials (email is case-insensitive)', async () => {
      const res = await request(app).post(`${AUTH}/login`).send({ email: 'ADMIN@example.com', password: ADMIN.password });
      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('admin');
    });

    it('401 with the SAME message for a wrong password and an unknown email', async () => {
      const wrongPassword = await request(app).post(`${AUTH}/login`).send({ email: ADMIN.email, password: 'nope-nope-1' });
      const unknownEmail = await request(app).post(`${AUTH}/login`).send({ email: 'ghost@example.com', password: 'nope-nope-1' });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(wrongPassword.body.detail).toBe('Invalid email or password');
      expect(unknownEmail.body.detail).toBe(wrongPassword.body.detail); // no user enumeration
    });
  });

  describe('GET /me', () => {
    it('returns the current user for a valid token', async () => {
      const { token } = await registerAs(app, SITA);
      const res = await request(app).get(`${AUTH}/me`).set(bearer(token));
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(SITA.email);
    });

    it('401 without a token, with a WWW-Authenticate header', async () => {
      const res = await request(app).get(`${AUTH}/me`);
      expect(res.status).toBe(401);
      expect(res.headers['www-authenticate']).toBe('Bearer');
    });

    it('401 with a garbage token', async () => {
      const res = await request(app).get(`${AUTH}/me`).set(bearer('not.a.jwt'));
      expect(res.status).toBe(401);
    });
  });

  describe('POST /refresh (rotation + reuse detection)', () => {
    it('issues a new access token AND a new refresh cookie', async () => {
      const { agent } = await registerAs(app, SITA);
      const res = await agent.post(`${AUTH}/refresh`);
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.headers['set-cookie'][0]).toMatch(/^refresh_token=/);
    });

    it('401 without a refresh cookie', async () => {
      expect((await request(app).post(`${AUTH}/refresh`)).status).toBe(401);
    });

    it('replaying an old refresh token kills the whole session', async () => {
      const register = await request(app).post(`${AUTH}/register`).send(SITA);
      const oldCookie = register.headers['set-cookie'][0].split(';')[0];

      const first = await request(app).post(`${AUTH}/refresh`).set('Cookie', oldCookie);
      expect(first.status).toBe(200);
      const newCookie = first.headers['set-cookie'][0].split(';')[0];

      const replay = await request(app).post(`${AUTH}/refresh`).set('Cookie', oldCookie); // attacker
      expect(replay.status).toBe(401);
      expect(replay.body.detail).toMatch(/reuse detected/);

      const victim = await request(app).post(`${AUTH}/refresh`).set('Cookie', newCookie);
      expect(victim.status).toBe(401); // family revoked: must log in again
    });

    it('picks up role changes on refresh', async () => {
      const { user, agent } = await registerAs(app, SITA);
      const { token: adminToken } = await loginAs(app, ADMIN);
      await request(app).patch(`/api/v1/users/${user.id}/role`).set(bearer(adminToken)).send({ role: 'admin' });

      const res = await agent.post(`${AUTH}/refresh`);
      expect(res.body.data.user.role).toBe('admin');
    });
  });

  describe('POST /logout', () => {
    it('204, clears the cookie, and the refresh token stops working', async () => {
      const register = await request(app).post(`${AUTH}/register`).send(SITA);
      const cookie = register.headers['set-cookie'][0].split(';')[0];

      const res = await request(app).post(`${AUTH}/logout`).set('Cookie', cookie);
      expect(res.status).toBe(204);
      expect(res.headers['set-cookie'][0]).toMatch(/refresh_token=;/);

      expect((await request(app).post(`${AUTH}/refresh`).set('Cookie', cookie)).status).toBe(401);
    });
  });

  describe('PATCH /password', () => {
    it('changes the password and logs out every device', async () => {
      const { token, agent } = await registerAs(app, SITA);

      const res = await request(app)
        .patch(`${AUTH}/password`)
        .set(bearer(token))
        .send({ currentPassword: SITA.password, newPassword: 'BrandNew789' });
      expect(res.status).toBe(204);

      expect((await agent.post(`${AUTH}/refresh`)).status).toBe(401); // old session gone
      expect((await request(app).post(`${AUTH}/login`).send({ email: SITA.email, password: SITA.password })).status).toBe(401);
      expect((await request(app).post(`${AUTH}/login`).send({ email: SITA.email, password: 'BrandNew789' })).status).toBe(200);
    });

    it('401 if the current password is wrong', async () => {
      const { token } = await registerAs(app, SITA);
      const res = await request(app)
        .patch(`${AUTH}/password`)
        .set(bearer(token))
        .send({ currentPassword: 'wrong-pass-1', newPassword: 'BrandNew789' });
      expect(res.status).toBe(401);
    });
  });
});