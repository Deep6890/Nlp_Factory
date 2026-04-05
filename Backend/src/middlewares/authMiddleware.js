const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Protect routes: verifies Bearer JWT and attaches `req.user` (Mongoose user).
 * Populates req.user with { _id, name, email, role }.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.sub).lean();
    if (!user) throw ApiError.unauthorized('User no longer exists');

    // Attach safe user shape – no password
    req.user = {
      _id:   user._id.toString(),
      name:  user.name,
      email: user.email,
      role:  user.role,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Invalid or expired token'));
    }
    next(err);
  }
};

/**
 * Restrict access to specific roles.
 * Must be used AFTER protect middleware.
 *
 * Usage: router.delete('/...', protect, restrictTo('admin'), handler)
 *
 * @param {...string} roles
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

module.exports = { protect, restrictTo };
