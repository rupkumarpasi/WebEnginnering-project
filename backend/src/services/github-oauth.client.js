import { unauthorized } from '../utils/http-error.js';

// Talks to GitHub's OAuth 2.0 endpoints. `fetch` is injectable so tests never call the real GitHub.
export class GithubOAuthClient {
  constructor({ clientId, clientSecret, callbackUrl }, { fetch: fetchFn = globalThis.fetch } = {}) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.callbackUrl = callbackUrl;
    this.fetch = fetchFn;
  }

  get isConfigured() {
    return Boolean(this.clientId && this.clientSecret);
  }

  // Step 1: where to send the user's browser.
  buildAuthorizeUrl({ state, codeChallenge }) {
    const url = new URL('https://github.com/login/oauth/authorize');
    url.search = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: 'read:user user:email',
      state, // CSRF protection: must come back unchanged
      code_challenge: codeChallenge, // PKCE
      code_challenge_method: 'S256',
    });
    return url.toString();
  }

  // Step 2: exchange the one-time ?code= for a GitHub access token (server-to-server).
  async exchangeCode({ code, codeVerifier }) {
    const res = await this.fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret, // secret stays on the server — never sent to the browser
        code,
        redirect_uri: this.callbackUrl,
        code_verifier: codeVerifier,
      }),
    });
    const body = await res.json();
    if (!res.ok || !body.access_token) throw unauthorized(`GitHub login failed: ${body.error ?? res.status}`);
    return body.access_token;
  }

  // Step 3: ask GitHub who the user is. We need a VERIFIED primary email to link accounts safely.
  async getProfile(accessToken) {
    const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'User-Agent': 'users-api' };
    const [userRes, emailsRes] = await Promise.all([
      this.fetch('https://api.github.com/user', { headers }),
      this.fetch('https://api.github.com/user/emails', { headers }),
    ]);
    if (!userRes.ok || !emailsRes.ok) throw unauthorized('Could not read GitHub profile');

    const user = await userRes.json();
    const emails = await emailsRes.json();
    const primary = emails.find((e) => e.primary && e.verified);
    if (!primary) throw unauthorized('Your GitHub account has no verified primary email');

    return { githubId: String(user.id), login: user.login, name: user.name, email: primary.email };
  }
}