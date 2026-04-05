const { query, param } = require('express-validator');
const mongoose         = require('mongoose');

// ── Helpers ──────────────────────────────────────────────────────────────────

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// ── Rule sets ────────────────────────────────────────────────────────────────

const listRecordingsRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100').toInt(),
];

/**
 * Validate :recordingId param as a valid MongoDB ObjectId.
 */
const recordingIdParamRules = [
  param('recordingId')
    .notEmpty().withMessage('recordingId param is required')
    .custom(isValidObjectId).withMessage('recordingId must be a valid MongoDB ObjectId'),
];

/**
 * Validate :userId param for GET /users/:userId/audios.
 * Accepts either 'me' (shorthand) or a valid MongoDB ObjectId.
 */
const getUserAudiosRules = [
  param('userId')
    .notEmpty().withMessage('userId param is required')
    .custom((value) => value === 'me' || isValidObjectId(value))
    .withMessage('userId must be "me" or a valid MongoDB ObjectId'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100').toInt(),
];

module.exports = { listRecordingsRules, recordingIdParamRules, getUserAudiosRules };
