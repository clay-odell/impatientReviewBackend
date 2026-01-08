
require('dotenv').config();
const http = require('http');
const app = require('./app');

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '127.0.0.1';

const server = http.createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`Received ${signal}. Closing server...`);
  server.close((err) => {
    if (err) {
      console.error('Error during server close', err);
      process.exit(1);
    }
    console.log('Server closed. Exiting.');
    process.exit(0);
  });

  // Force exit if shutdown takes too long
  setTimeout(() => {
    console.warn('Forcing shutdown after timeout.');
    process.exit(1);
  }, 30_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Log unhandled errors and exit
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});
