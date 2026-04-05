class ApiError extends Error {
  /**
   * @param {number} statusCode  HTTP status code
   * @param {string} message     Human-readable error message
   * @param {Array}  errors      Optional array of validation / detail errors
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.success    = false;
    this.errors     = errors;

    // Maintain proper stack trace (Node.js only)
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Convenience factory methods ──────────────────────────────────────
  static badRequest(message, errors = [])  { return new ApiError(400, message, errors); }
  static unauthorized(message = 'Unauthorized') { return new ApiError(401, message); }
  static forbidden(message = 'Forbidden')       { return new ApiError(403, message); }
  static notFound(message = 'Resource not found') { return new ApiError(404, message); }
  static conflict(message)                       { return new ApiError(409, message); }
  static internal(message = 'Internal server error') { return new ApiError(500, message); }
}

module.exports = ApiError;
