import cors from 'cors';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { forbidden, HttpError } from '../utils/http-error.js';
import { rateLimitConfig } from '../config/redis-rate-limit.js';

// ── Security headers (OWASP A05 Security Misconfiguration) ──
// Helmet sets ~13 headers: Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options,
// X-Frame-Options, Referrer-Policy, Cross-Origin-*-Policy, and removes X-Powered-By.
export const securityHeaders = () =>
  helmet({
    // Avatars under /uploads must be loadable by the frontend on another PORT of the same site
    // (localhost:5173 → localhost:3000). "same-site" allows that; "same-origin" (default) would block it.
    crossOriginResourcePolicy: { policy: 'same-site' },
  });

// ── CORS: which OTHER websites may call this API from a browser ──
export const corsPolicy = (allowedOrigins) =>
  cors({
    origin(origin, callback) {
      // No Origin header = not a cross-site browser request (curl, server-to-server, same-origin GET).
      callback(null, !origin || allowedOrigins.includes(origin));
    },
    credentials: true, // allow the refresh-token cookie
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'], //Headers the browser is allowed to send
    exposedHeaders: ['X-Request-Id', 'Location'],//Response headers JavaScript is allowed to read
//     Header	Purpose
// X-Request-Id	Identifies a particular request for debugging and log tracking
// Location	Provides the URL of a newly created resource or another relevant resource
    maxAge: 600, // browsers may cache the preflight answer for 10 minutes
  });

// ── CSRF defence for COOKIE-authenticated routes (/auth/refresh, /auth/logout) ──
// Browsers always send an Origin header on cross-site POSTs. If it's there and not ours → reject.
// (Layered with SameSite=Strict cookies and requireJson: an HTML <form> can't send application/json.)
export const verifyOrigin = (allowedOrigins) => (req, res, next) => {
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) return next(forbidden('Cross-site request blocked'));
  next();
};

// ── Rate limiting (OWASP A07: brute force, credential stuffing; also basic DoS protection) ──
const tooManyRequests = (message) => (req, res, next) =>
  next(new HttpError(429, 'Too Many Requests', message));

// export const apiRateLimit = ({ windowMs, limit }) =>
//   rateLimit({
//     windowMs,
//     limit,
//     standardHeaders: 'draft-8', // RateLimit + RateLimit-Policy headers
//     legacyHeaders: false,
//     handler: tooManyRequests('Too many requests, please try again later'),
//   });

// export const authRateLimit = ({ windowMs, limit }) =>
//   rateLimit({
//     windowMs,
//     limit,
//     standardHeaders: 'draft-8',
//     legacyHeaders: false,
//     skipSuccessfulRequests: true, // only FAILED logins count against the limit
//     // Key = IP + email, so one attacker can't lock out every user, and one user can't be brute-forced.
//     keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? '').toLowerCase()}`,
//     handler: tooManyRequests('Too many attempts, please try again in 15 minutes'),
//   });


export const authRateLimit =({windowMs,limit}, { redisClient = null }={})=>{
return rateLimitConfig({
  windowMs, // 15 minutes
  limit, // 5 FAILED attempts per IP + email
  prefix: 'Auth:',
  route: 'auth',
  redisClient, // Redis client for distributed rate limiting
  skipSuccessfulRequests: true, // only FAILED logins count against the limit
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? '').toLowerCase()}`,
  handler: tooManyRequests('Too many attempts, please try again in 15 minutes'), // Prefix for Redis keys to avoid collisions with other rate limits
});
} 


export const apiRateLimit =({windowMs,limit}, { redisClient = null }={})=>{
 return rateLimitConfig({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true, // only FAILED logins count against the limit
    // Key = IP + email, so one attacker can't lock out every user, and one user can't be brute-forced.
    keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? '').toLowerCase()}`,
    handler: tooManyRequests('Too many attempts, please try again in 15 minutes'),
  });
}
