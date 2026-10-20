import { createHash, randomBytes } from 'node:crypto';

// PKCE (Proof Key for Code Exchange, RFC 7636):
// we keep a random `verifier` secret and send only its SHA-256 `challenge` to GitHub.
// When exchanging the code we must prove we know the verifier, so a stolen ?code= is useless.
export function createPkcePair() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export const createState = () => randomBytes(16).toString('base64url');