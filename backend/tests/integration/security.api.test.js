import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ADMIN, buildTestApp, SITA } from '../helpers.js';

const FRONTEND = 'http://localhost:5173';
const EVIL = 'https://evil.example';

describe('Security headers (Helmet)', () => {
  it('sets the important headers on every response', async () => {
    const { app } = await buildTestApp();
    const res = await request(app).get('/health');

    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['strict-transport-security']).toMatch(/max-age=\d+/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['cross-origin-resource-policy']).toBe('same-site');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS', () => {
  it('allows the configured frontend origin, with credentials', async () => {
    const { app } = await buildTestApp({ security: { corsOrigins: [FRONTEND] } });
    const res = await request(app).get('/health').set('Origin', FRONTEND);
    expect(res.headers['access-control-allow-origin']).toBe(FRONTEND);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('gives NO CORS headers to other origins (the browser then blocks the response)', async () => {
    const { app } = await buildTestApp({ security: { corsOrigins: [FRONTEND] } });
    const res = await request(app).get('/health').set('Origin', EVIL);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers preflight requests', async () => {
    const { app } = await buildTestApp({ security: { corsOrigins: [FRONTEND] } });
    const res = await request(app)
      .options('/api/v1/users')
      .set('Origin', FRONTEND)
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'authorization,content-type');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-methods']).toContain('PATCH');
    expect(res.headers['access-control-allow-headers']).toMatch(/Authorization/i);
    expect(res.headers['access-control-max-age']).toBe('600');
  });
});

describe('CSRF protection on cookie-authenticated routes', () => {
  it('403 for /auth/refresh from a foreign Origin, 200 from our frontend', async () => {
    const { app } = await buildTestApp({ security: { corsOrigins: [FRONTEND] } });
    const reg = await request(app).post('/api/v1/auth/register').send(SITA);
    const cookie = reg.headers['set-cookie'][0].split(';')[0];

    const evil = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie).set('Origin', EVIL);
    expect(evil.status).toBe(403);
    expect(evil.body.detail).toBe('Cross-site request blocked');

    const ours = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie).set('Origin', FRONTEND);
    expect(ours.status).toBe(200);
  });

  it('415 for an HTML-form style POST (forms cannot send application/json)', async () => {
    const { app } = await buildTestApp();
    const res = await request(app).post('/api/v1/auth/login').type('form').send('email=a@b.co&password=x');
    expect(res.status).toBe(415);
  });
});

describe('Rate limiting', () => {
  it('429 with RateLimit headers after too many API requests', async () => {
    const { app } = await buildTestApp({ security: { apiRateLimit: { windowMs: 60_000, limit: 3 } } });

    const first = await request(app).get('/api/v1/auth/me');
    expect(first.headers['ratelimit-policy']).toMatch(/^"3-in-1min"; q=3; w=60/); // 3 requests per 60 s
    expect(first.headers.ratelimit).toMatch(/r=2/); // 2 remaining
    for (let i = 0; i < 2; i++) await request(app).get('/api/v1/auth/me');

    const blocked = await request(app).get('/api/v1/auth/me');
    expect(blocked.status).toBe(429);
    expect(blocked.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('login: blocks after 5 FAILED attempts for the same email, but successful logins do not count', async () => {
    const { app } = await buildTestApp();
    const login = (password) => request(app).post('/api/v1/auth/login').send({ email: ADMIN.email, password });

    for (let i = 0; i < 3; i++) expect((await login(ADMIN.password)).status).toBe(200); // not counted
    for (let i = 0; i < 5; i++) expect((await login('wrong-password-1')).status).toBe(401);

    const blocked = await login(ADMIN.password); // even the RIGHT password is blocked now
    expect(blocked.status).toBe(429);
    expect(blocked.body.detail).toBe('Too many attempts, please try again in 15 minutes');

    // A different account from the same IP is not affected
    expect((await request(app).post('/api/v1/auth/login').send({ email: 'ghost@example.com', password: 'x' })).status).toBe(401);
  });
});

describe('Injection & input attacks over HTTP', () => {
  it('NoSQL-style login bypass → 400, not 200', async () => {
    const { app } = await buildTestApp();
    const res = await request(app).post('/api/v1/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
    expect(res.body.error.map((e) => e.field)).toEqual(['email', 'password']);
  });

  it('stored-XSS payload in a name → 400', async () => {
    const { app } = await buildTestApp();
    const res = await request(app).post('/api/v1/auth/register').send({ ...SITA, firstName: '<script>alert(1)</script>' });
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual([{ field: 'firstName', message: 'may only contain letters, spaces, apostrophes, dots and hyphens' }]);
  });

  it('prototype pollution attempt → 400, and Object.prototype stays clean', async () => {
    const { app } = await buildTestApp();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"firstName":"Sita","lastName":"G","email":"s@x.co","password":"Secret123","__proto__":{"isAdmin":true}}');
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual([{ field: '__proto__', message: 'is not allowed' }]);
    expect({}.isAdmin).toBeUndefined();
  });

  it('errors never leak stack traces or internals', async () => {
    const { app } = await buildTestApp();
    const res = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{"broken');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toMatch(/at \w+ \(|node_modules|\.js:\d+/);
  });
});
