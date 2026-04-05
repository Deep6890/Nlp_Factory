const { validationResult } = require('express-validator');
const userService  = require('../services/userService');
const ApiResponse  = require('../utils/ApiResponse');
const ApiError     = require('../utils/ApiError');

const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw ApiError.badRequest('Validation failed', errors.array());
};

/**
 * GET /api/v1/users/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user._id);
    return res.status(200).json(ApiResponse.ok('User profile', { user }));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/users/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const stats = await userService.getDashboardStats(req.user._id);
    return res.status(200).json(ApiResponse.ok('Dashboard stats', { stats }));
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    handleValidation(req);
    const user = await userService.updateProfile(req.user._id, req.body);
    return res.status(200).json(ApiResponse.ok('Profile updated', { user }));
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, getDashboard, updateProfile };
