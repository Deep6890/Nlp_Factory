require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const app = require('./app');
const { logger } = require('./utils/logger');

const PORT = parseInt(process.env.PORT || '5000', 10);

const start = async () => {
  const REQUIRED_ENV = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`🚀  Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received – shutting down gracefully…`);
    server.close(() => { logger.info('HTTP server closed.'); process.exit(0); });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
    server.close(() => process.exit(1));
  });
};

start();


