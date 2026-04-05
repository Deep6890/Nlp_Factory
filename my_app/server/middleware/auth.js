/**
 * middleware/auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * JWT auth middleware — attaches req.user from the Bearer token.
 *
 * Expected header:
 *   Authorization: Bearer <jwt_token>
 */

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.slice(7).trim();
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('[AUTH] JWT_SECRET is not set in environment!');
      return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET missing' });
    }

    const decoded = jwt.verify(token, secret);
    req.user = { _id: decoded.id || decoded._id || decoded.userId };

    if (!req.user._id) {
      return res.status(401).json({ error: 'Token does not contain a valid user id' });
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired — please log in again' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('[AUTH] Unexpected error:', err.message);
    res.status(500).json({ error: 'Authentication error' });
  }
}

module.exports = authMiddleware;
