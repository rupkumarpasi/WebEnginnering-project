import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Test-only values. config/env.js refuses to start without a JWT_SECRET.
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: '>Sxol=L(?E,N:abVO0E5[/e5![a5*6(9',
    },
  },
});