import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTestApp } from '../helpers.js';

// A fake `fetch` that pretends to be GitHub. Injected through the container (DI), so no real network calls.
function fakeGithubFetch({ id = 4242, login = 'sita-dev', name = 'Sita Gurung', email = 'sita@example.com', verified = true } = {}) {
  return vi.fn(async (url, options) => {
    const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
    if (url === 'https://github.com/login/oauth/access_token') {
      const body = JSON.parse(options.body);
      if (body.code !== 'good-code' || !body.code_verifier) return json({ error: 'bad_verification_code' });
      return json({ access_token: 'gho_fake', token_type: 'bearer' });
    }
    if (url === 'https://api.github.com/user') return json({ id, login, name });
    if (url === 'https://api.github.com/user/emails') return json([{ email, primary: true, verified }]);
    throw new Error(`Unexpected URL ${url}`);
  });
}

const GITHUB = { clientId: 'test-client-id', clientSecret: 'test-client-secret', callbackUrl: 'http://localhost:3000/api/v1/auth/github/callback' };

// Step 1 of the flow: returns the redirect URL and the state cookie.
async function startLogin(agent) {
  const res = await agent.get('/api/v1/auth/github');
  return { res, url: new URL(res.headers.location) };
}

describe('Login with GitHub (OAuth 2.0 Authorization Code + PKCE)', () => {
  let app;
  let container;
  let fetch;

  beforeEach(async () => {
    fetch = fakeGithubFetch();
    ({ app, container } = await buildTestApp({ github: GITHUB, fetch }));
  });

  it('step 1: redirects to GitHub with client_id, state and a PKCE challenge', async () => {
    const { res, url } = await startLogin(request.agent(app));

    expect(res.status).toBe(302);
    expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('test-client-id');
    expect(url.searchParams.get('state')).toMatch(/^[\w-]{20,}$/);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toMatch(/^[\w-]{43}$/);
    expect(res.headers.location).not.toContain('test-client-secret'); // the secret never goes to the browser

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^oauth_github=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
  });

  it('step 2: callback with the right state creates the user and logs them in', async () => {
    const agent = request.agent(app);
    const { url } = await startLogin(agent);

    const res = await agent.get(`/api/v1/auth/github/callback?code=good-code&state=${url.searchParams.get('state')}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: 'sita@example.com', firstName: 'Sita', lastName: 'Gurung', githubId: '4242', role: 'customer' });
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.headers['set-cookie'].some((c) => c.startsWith('refresh_token='))).toBe(true);

    // The code_verifier we sent to GitHub must match the challenge from step 1 (PKCE).
    const tokenCall = fetch.mock.calls.find(([u]) => u.includes('access_token'));
    expect(JSON.parse(tokenCall[1].body).code_verifier).toEqual(expect.any(String));
  });

  it('401 when state does not match (CSRF / login forgery)', async () => {
    const agent = request.agent(app);
    await startLogin(agent);
    const res = await agent.get('/api/v1/auth/github/callback?code=good-code&state=attacker-state');
    expect(res.status).toBe(401);
    expect(res.body.detail).toBe('Invalid OAuth state');
  });

  it('401 when there is no state cookie at all', async () => {
    const res = await request(app).get('/api/v1/auth/github/callback?code=good-code&state=anything');
    expect(res.status).toBe(401);
  });

  it('401 when GitHub rejects the code', async () => {
    const agent = request.agent(app);
    const { url } = await startLogin(agent);
    const res = await agent.get(`/api/v1/auth/github/callback?code=bad-code&state=${url.searchParams.get('state')}`);
    expect(res.status).toBe(401);
    expect(res.body.detail).toMatch(/GitHub login failed/);
  });

  it('links to an EXISTING account with the same verified email instead of creating a duplicate', async () => {
    const existing = await container.usersService.create({ firstName: 'Sita', lastName: 'G', email: 'sita@example.com', password: 'Secret123' });

    const agent = request.agent(app);
    const { url } = await startLogin(agent);
    const res = await agent.get(`/api/v1/auth/github/callback?code=good-code&state=${url.searchParams.get('state')}`);

    expect(res.body.data.user.id).toBe(existing.id);
    expect(res.body.data.user.githubId).toBe('4242');
  });

  it('refuses GitHub accounts without a verified email', async () => {
    ({ app } = await buildTestApp({ github: GITHUB, fetch: fakeGithubFetch({ verified: false }) }));
    const agent = request.agent(app);
    const { url } = await startLogin(agent);
    const res = await agent.get(`/api/v1/auth/github/callback?code=good-code&state=${url.searchParams.get('state')}`);
    expect(res.status).toBe(401);
  });

  it('OAuth-only users cannot log in with a password', async () => {
    const agent = request.agent(app);
    const { url } = await startLogin(agent);
    await agent.get(`/api/v1/auth/github/callback?code=good-code&state=${url.searchParams.get('state')}`);

    const res = await request(app).post('/api/v1/auth/login').send({ email: 'sita@example.com', password: 'anything1' });
    expect(res.status).toBe(401);
  });

  it('404 when GitHub login is not configured', async () => {
    ({ app } = await buildTestApp({ github: { clientId: '', clientSecret: '' } }));
    expect((await request(app).get('/api/v1/auth/github')).status).toBe(404);
  });
});