import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { ADMIN, bearer, buildTestApp, loginAs, RAM, registerAs, SITA } from '../helpers.js';

const USERS = '/api/v1/users';

describe('Users API with RBAC + ABAC', () => {
  let app;
  let admin; // { user, token }
  let sita;
  let ram;

  beforeEach(async () => {
    ({ app } = await buildTestApp());
    admin = await loginAs(app, ADMIN);
    sita = await registerAs(app, SITA);
    ram = await registerAs(app, RAM);
  });

  it('401 for every /users route without a token', async () => {
    expect((await request(app).get(USERS)).status).toBe(401);
    expect((await request(app).get(`${USERS}/${sita.user.id}`)).status).toBe(401);
  });

  describe('RBAC: admin-only routes', () => {
    it('GET /users: admin 200, customer 403', async () => {
      const asAdmin = await request(app).get(USERS).set(bearer(admin.token));
      expect(asAdmin.status).toBe(200);
      expect(asAdmin.body.meta.total).toBe(3);

      const asCustomer = await request(app).get(USERS).set(bearer(sita.token));
      expect(asCustomer.status).toBe(403);
      expect(asCustomer.body.detail).toBe('Requires role: admin');
    });

    it('PATCH /users/:id/role: only admins can promote', async () => {
      const bySita = await request(app).patch(`${USERS}/${sita.user.id}/role`).set(bearer(sita.token)).send({ role: 'admin' });
      expect(bySita.status).toBe(403); // can't promote yourself

      const byAdmin = await request(app).patch(`${USERS}/${sita.user.id}/role`).set(bearer(admin.token)).send({ role: 'admin' });
      expect(byAdmin.status).toBe(200);
      expect(byAdmin.body.data.role).toBe('admin');
    });

    it('400 for an invalid role', async () => {
      const res = await request(app).patch(`${USERS}/${sita.user.id}/role`).set(bearer(admin.token)).send({ role: 'superuser' });
      expect(res.status).toBe(400);
    });
  });

  describe('ABAC: ownership rules', () => {
    it('a customer can read and update THEIR OWN profile', async () => {
      const url = `${USERS}/${sita.user.id}`;
      expect((await request(app).get(url).set(bearer(sita.token))).status).toBe(200);

      const res = await request(app).patch(url).set(bearer(sita.token)).send({ phone: '+977-9811111111' });
      expect(res.status).toBe(200);
      expect(res.body.data.phone).toBe('+977-9811111111');
    });

    it("a customer can NOT read or update someone else's profile", async () => {
      const url = `${USERS}/${ram.user.id}`;
      expect((await request(app).get(url).set(bearer(sita.token))).status).toBe(403);
      expect((await request(app).patch(url).set(bearer(sita.token)).send({ phone: '+977-9811111111' })).status).toBe(403);
    });

    it('an admin can read and update anyone', async () => {
      const url = `${USERS}/${ram.user.id}`;
      expect((await request(app).get(url).set(bearer(admin.token))).status).toBe(200);
      expect((await request(app).patch(url).set(bearer(admin.token)).send({ lastName: 'Thapa Magar' })).status).toBe(200);
    });

    it('DELETE: customers never; admins yes, but not themselves', async () => {
      expect((await request(app).delete(`${USERS}/${sita.user.id}`).set(bearer(sita.token))).status).toBe(403);
      expect((await request(app).delete(`${USERS}/${admin.user.id}`).set(bearer(admin.token))).status).toBe(403);
      expect((await request(app).delete(`${USERS}/${sita.user.id}`).set(bearer(admin.token))).status).toBe(204);
    });
  });

  it('middleware order: 401 (no token) is checked before 400 (bad id)', async () => {
    expect((await request(app).get(`${USERS}/123`)).status).toBe(401);
    expect((await request(app).get(`${USERS}/123`).set(bearer(admin.token))).status).toBe(400);
  });
});