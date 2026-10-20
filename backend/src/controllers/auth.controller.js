import { config } from '../config/env.js';
import { createPkcePair, createState } from '../auth/pkce.js';
import { badRequest, notFound, unauthorized } from '../utils/http-error.js';

const REFRESH_COOKIE = 'refresh_token';
const OAUTH_COOKIE = 'oauth_github';

// The refresh token lives in an httpOnly cookie: JavaScript in the page can NEVER read it (XSS-safe),
// and sameSite=strict stops other sites from sending it (CSRF-safe). Path limits it to /auth routes.
const refreshCookieOptions = (expiresAt) => ({
  httpOnly: true,
  secure: config.isProduction, // HTTPS-only in production
  sameSite: 'strict',
  path: '/api/v1/auth',
  expires: new Date(expiresAt),
});

export class AuthController {
  constructor(authService, usersService, githubClient) {
    this.auth = authService;
    this.users = usersService;
    this.github = githubClient;
  }

  // Common response for register / login / refresh / GitHub login.
  #sendSession(res, { user, accessToken, refresh }, status = 200) {
    res
      .status(status)
      .cookie(REFRESH_COOKIE, refresh.token, refreshCookieOptions(refresh.expiresAt))
      .json({
        data: {
          user,
          accessToken,
          tokenType: 'Bearer',
          expiresIn: config.auth.accessTokenTtlSeconds,
        },
      });
  }

  register = async (req, res) => {
    this.#sendSession(res, await this.auth.register(req.body), 201);
  };

  login = async (req, res) => {
    this.#sendSession(res, await this.auth.login(req.body.email, req.body.password));
  };

  refresh = async (req, res) => {
    this.#sendSession(res, await this.auth.refresh(req.cookies[REFRESH_COOKIE]));
  };

  logout = async (req, res) => {
    await this.auth.logout(req.cookies[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' }).status(204).end();
  };

  me = async (req, res) => {
    res.json({ data: await this.users.getById(req.user.id) });
  };

  changePassword = async (req, res) => {
    await this.auth.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' }).status(204).end();
  };

  // ── OAuth 2.0 Authorization Code flow + PKCE with GitHub ──

  githubStart = async (req, res) => {
    if (!this.github.isConfigured) throw notFound('GitHub login is not enabled on this server');
    const state = createState();
    const { verifier, challenge } = createPkcePair();
    // Remember state + verifier for 10 minutes. sameSite=lax so the cookie IS sent when GitHub redirects back.
    res.cookie(OAUTH_COOKIE, JSON.stringify({ state, verifier }), {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth/github',
      maxAge: 10 * 60 * 1000,
    });
    res.redirect(this.github.buildAuthorizeUrl({ state, codeChallenge: challenge }));
  };

  githubCallback = async (req, res) => {
    const saved = parseJson(req.cookies[OAUTH_COOKIE]);
    res.clearCookie(OAUTH_COOKIE, { path: '/api/v1/auth/github' }); // one-time use

    if (typeof req.query.error === 'string') throw unauthorized(`GitHub login cancelled: ${req.query.error}`);
    if (!saved || typeof req.query.state !== 'string' || req.query.state !== saved.state) {
      throw unauthorized('Invalid OAuth state'); // possible CSRF / login-forgery attempt
    }
    if (typeof req.query.code !== 'string') throw badRequest('Missing authorization code');

    const githubToken = await this.github.exchangeCode({ code: req.query.code, codeVerifier: saved.verifier });
    const profile = await this.github.getProfile(githubToken);
    this.#sendSession(res, await this.auth.loginWithGithub(profile));
  };
}

function parseJson(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}