import { unauthorized } from '../utils/http-error.js';

// Authentication = "WHO are you?"  Reads "Authorization: Bearer <accessToken>" and sets req.user = { id, role }.
export function createAuthenticate(tokenService) {
  return function authenticate(req, res, next) {
    const [scheme, token] = (req.get('authorization') ?? '').split(' ');
    if (!/^Bearer$/i.test(scheme) || !token) {
      res.set('WWW-Authenticate', 'Bearer');
      return next(unauthorized('Missing Bearer access token'));
    }
    try {
      req.user = tokenService.verifyAccessToken(token);
      next();
    } catch (err) {
      res.set('WWW-Authenticate', 'Bearer error="invalid_token"');
      next(err);
    }
  };
}