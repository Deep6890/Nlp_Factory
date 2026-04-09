const { query, param } = require('express-validator');

// Supabase uses UUIDs — validate UUID v4 format
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (value) => UUID_REGEX.test(value);

const listRecordingsRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100').toInt(),
];

const recordingIdParamRules = [
  param('recordingId')
    .notEmpty().withMessage('recordingId param is required')
    .custom(isValidUUID).withMessage('recordingId must be a valid UUID'),
];

const getUserAudiosRules = [
  param('userId')
    .notEmpty().withMessage('userId param is required')
    .custom((value) => value === 'me' || isValidUUID(value))
    .withMessage('userId must be "me" or a valid UUID'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100').toInt(),
];

module.exports = { listRecordingsRules, recordingIdParamRules, getUserAudiosRules };
