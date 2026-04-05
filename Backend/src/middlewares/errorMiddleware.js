const ApiError = require('../utils/ApiError');

/**
 * Global error handler — must be the LAST middleware registered in app.js.
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  // Handle Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File too large (max 50 MB)', errors: [] });
    }
    return res.status(400).json({ success: false, message: err.message, errors: [] });
  }

  // Handle known ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors:  err.errors,
    });
  }

  // Fallback: generic 500
  console.error('[GlobalErrorHandler]', err);
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    errors:  [],
  });
};

module.exports = { errorMiddleware };
