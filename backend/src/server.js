import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

const server = app.listen(config.port, config.host, () => {
  console.log(`👤 Users API on http://${config.host}:${config.port} (${config.env}, pid ${process.pid})`);
});

// Graceful shutdown: stop accepting new connections, finish in-flight requests, then exit.
function shutdown(signal) {
  console.log(`${signal} received — shutting down`);
  server.close(() => process.exit(0));
  server.closeIdleConnections();
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);