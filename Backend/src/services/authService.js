const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Generate a signed JWT for a given user _id.
 * @param {string} userId
 * @returns {string}
 */
const signToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} body
 * @returns {{ user: object, token: string }}
 */
const signUp = async ({ name, email, password }) => {
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw ApiError.conflict('Email is already registered');

  const user  = await User.create({ name: name.trim(), email, password });
  const token = signToken(user._id.toString());

  return { user: user.toJSON(), token };
};

/**
 * Log in an existing user.
 * @param {{ email: string, password: string }} body
 * @returns {{ user: object, token: string }}
 */
const logIn = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

  const token = signToken(user._id.toString());

  // Return safe user shape (no password)
  const safeUser = user.toJSON();
  return { user: safeUser, token };
};

module.exports = { signUp, logIn };
