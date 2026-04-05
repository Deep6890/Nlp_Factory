const morgan = require('morgan');

/**
 * HTTP request logger middleware.
 * Uses 'dev' format in development, 'combined' in production.
 */
const httpLogger = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  {
    skip: (req) => req.url === '/health', // skip noisy health-check logs
  }
);

/**
 * Simple console logger for application-level events.
 */
const logger = {
  info:  (...args) => console.log('[INFO]',  new Date().toISOString(), ...args),
  warn:  (...args) => console.warn('[WARN]',  new Date().toISOString(), ...args),
  error: (...args) => console.error('[ERROR]', new Date().toISOString(), ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DEBUG]', new Date().toISOString(), ...args);
    }
  },
};

module.exports = { httpLogger, logger };
