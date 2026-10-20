

import onHeaders from 'on-headers';
import { performance } from 'node:perf_hooks';

export function responseTime(req, res, next) {
  // 1. Record the start time
  const start = performance.now();

  // 2. Use on-headers to safely inject the header right before headers are sent
  onHeaders(res, () => {
    const duration = performance.now() - start;
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
  });

  next();
}