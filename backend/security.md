
# Security Report — users-api

## Overview

This document explains how the users-api application addresses the OWASP Top 10 (2021) security risks.

The application uses Express.js, Zod validation, JWT authentication, refresh-token cookies, rate limiting, Helmet, CORS restrictions, and secure database access patterns.

## OWASP Top 10 Security Assessment

| # | Risk | Defence implemented |
|---|---|---|
| A01 | Broken Access Control | Authentication middleware verifies JWTs, while RBAC/ABAC policies restrict users from accessing resources they are not authorized to modify. |
| A02 | Cryptographic Failures | Passwords are hashed using scrypt with unique salts, JWTs are signed and verified, and HTTPS/HSTS protects data in transit. |
| A03 | Injection | Zod strict validation rejects unexpected input types and properties, while database queries use safe parameterized or ORM query methods. |
| A04 | Insecure Design | Login and API rate limiting reduce abuse, while refresh-token rotation and reuse detection help prevent session compromise. |
| A05 | Security Misconfiguration | Helmet configures security headers, CORS uses an origin allow-list, and centralized Problem Details responses avoid exposing internal stack traces. |
| A06 | Vulnerable Components | npm audit, package-lock.json, npm ci, and GitHub Dependabot alerts help identify and manage vulnerable dependencies. |
| A07 | Identification and Authentication Failures | Password hashing, login rate limiting, generic authentication errors, JWT verification, and secure refresh-token handling protect authentication. |
| A08 | Software and Data Integrity Failures | JWT signatures and an explicitly allowed signing algorithm protect token integrity. npm ci installs dependencies from the lock file. |
| A09 | Logging and Monitoring Failures | Request IDs and structured application logs help trace requests and investigate errors. Centralized monitoring and alerting are future improvements. |
| A10 | Server-Side Request Forgery (SSRF) | The application does not fetch arbitrary user-supplied URLs. External resource locations are controlled by the application. |

## Additional Security Measures

### 1. Cross-Site Scripting (XSS)

The application uses the following protections:

- Validate user input with Zod.
- Escape untrusted data when rendering HTML.
- Avoid inserting untrusted data using innerHTML.
- Configure Content-Security-Policy through Helmet.
- Use HttpOnly cookies for refresh tokens.
- Return correct Content-Type headers and use X-Content-Type-Options: nosniff.

### 2. Mass Assignment

- Use strict Zod schemas to reject unexpected properties.
- Explicitly select fields when creating or updating users.
- Never allow users to assign privileged fields such as role or isAdmin.

### 3. Prototype Pollution

- Reject unexpected properties such as __proto__.
- Avoid unsafe object merging with untrusted input.
- Validate request bodies before processing them.

### 4. Rate Limiting

- Apply a general rate limiter to API routes.
- Apply stricter rate limits to authentication endpoints.
- Use Redis-backed rate limiting when configured.

### 5. Security Headers

Helmet configures HTTP security headers, including:

- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy





## Remaining Security Weakness

### Access Token Validity After Logout

**Weakness:** When a user logs out, the refresh token is revoked and its cookie is cleared. However, an already-issued JWT access token can remain valid until its expiration time.

**Risk:** If an access token is stolen before logout, an attacker may continue accessing protected API endpoints until the token expires.

**Proposed Fix:**
- Keep access tokens short-lived (5–15 minutes).
- Include a unique token identifier (`jti`) in each access token.
- Store revoked token identifiers in Redis until their expiration.
- Check the revocation status in authentication middleware.
- Continue using refresh-token rotation and reuse detection.

This would allow immediate access-token revocation and reduce the risk of unauthorized access after logout.



## Conclusion

The users-api implements multiple layers of security to protect user data, authentication, and API endpoints. Security is an ongoing process, and dependencies, configurations, and security controls should be reviewed regularly.





