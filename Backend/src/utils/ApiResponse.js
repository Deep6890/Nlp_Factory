class ApiResponse {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {*}      data
   */
  constructor(statusCode, message, data = null) {
    this.success    = statusCode < 400;
    this.statusCode = statusCode;
    this.message    = message;
    if (data !== null && data !== undefined) {
      this.data = data;
    }
  }

  // ── Convenience factory methods ──────────────────────────────────────
  static ok(message, data)      { return new ApiResponse(200, message, data); }
  static created(message, data) { return new ApiResponse(201, message, data); }
  static noContent(message)     { return new ApiResponse(204, message); }

  /** Send a standardised JSON response via an Express response object. */
  static send(res, statusCode, message, data) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data));
  }
}

module.exports = ApiResponse;
