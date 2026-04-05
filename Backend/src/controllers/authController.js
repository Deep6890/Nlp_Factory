const { validationResult } = require('express-validator');
const authService  = require('../services/authService');
const ApiResponse  = require('../utils/ApiResponse');
const ApiError     = require('../utils/ApiError');

const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw ApiError.badRequest('Validation failed', errors.array());
};

/**
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    handleValidation(req);
    const { user, token } = await authService.signUp(req.body);
    return res.status(201).json(ApiResponse.created('Account created successfully', { user, token }));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 */
const logIn = async (req, res, next) => {
  try {
    handleValidation(req);
    const { user, token } = await authService.logIn(req.body);
    return res.status(200).json(ApiResponse.ok('Login successful', { user, token }));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me  (alias – identical to GET /api/v1/users/me)
 */
const getMe = (req, res) => {
  return res.status(200).json(ApiResponse.ok('Authenticated user', { user: req.user }));
};

module.exports = { register, logIn, getMe };
