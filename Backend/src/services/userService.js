const User       = require('../models/User');
const ApiError   = require('../utils/ApiError');
const Recording  = require('../models/Recording');
const Transcript = require('../models/Transcript');

/**
 * Fetch a user by id (no password).
 *
 * @param {string} userId
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound('User not found');

  return {
    _id:       user._id.toString(),
    name:      user.name,
    email:     user.email,
    role:      user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Update the authenticated user's name.
 *
 * @param {string} userId
 * @param {{ name: string }} payload
 */
const updateProfile = async (userId, { name }) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { name: name.trim() },
    { returnDocument: 'after', runValidators: true }
  ).lean();

  if (!user) throw ApiError.notFound('User not found');

  return {
    _id:       user._id.toString(),
    name:      user.name,
    email:     user.email,
    role:      user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Aggregate dashboard stats for a user.
 * Pulls recording + transcript counts from MongoDB.
 *
 * @param {string} userId
 */
const getDashboardStats = async (userId) => {
  const [totalRecordings, totalTranscripts, highRiskCount, financeCount] = await Promise.all([
    Recording.countDocuments({ userId }),
    Transcript.countDocuments({ userId }),
    Transcript.countDocuments({ userId, status: 'done', 'insights.risk_level': 'high' }),
    Transcript.countDocuments({ userId, status: 'done', 'insights.finance_detected': true }),
  ]);

  return { totalRecordings, totalTranscripts, highRiskCount, financeCount };
};

module.exports = { getUserById, updateProfile, getDashboardStats };
