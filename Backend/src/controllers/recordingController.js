const { validationResult } = require('express-validator');
const recordingService = require('../services/recordingService');
const storageService   = require('../services/storageService');
const transcriptService = require('../services/transcriptService');
const ApiResponse      = require('../utils/ApiResponse');
const ApiError         = require('../utils/ApiError');

const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw ApiError.badRequest('Validation failed', errors.array());
};

/**
 * POST /api/v1/recordings/upload
 * Accepts multipart/form-data with field `audio`.
 */
const uploadRecording = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest('No audio file provided. Use field name "audio".');

    const { buffer, mimetype, originalname, size } = req.file;

    // Extract client metadata from multipart fields
    const { mode = 'adaptive', durationSec, recordedAt } = req.body;

    // 1. Upload to Cloudinary
    const { cloudUrl, cloudPublicId } = await storageService.uploadToCloud(
      buffer,
      mimetype,
      req.user._id
    );

    // 2. Persist recording document
    const recording = await recordingService.createRecording(req.user._id, {
      filename:      originalname || 'audio',
      cloudUrl,
      cloudPublicId,
      mimeType:      mimetype,
      size,
      duration:      durationSec ? Number(durationSec) : null,
      mode:          mode || 'adaptive',
      recordedAt:    recordedAt ? new Date(recordedAt) : null,
    });

    // 3. Create a pending transcript record in the Transcript collection
    const transcript = await transcriptService.createPendingTranscript(req.user._id, recording._id);

    // 4. Kick off transcript generation (fire-and-forget, non-blocking)
    setImmediate(async () => {
      try {
        await transcriptService.processTranscript(req.user._id, recording._id, cloudUrl, buffer, originalname);
      } catch (err) {
        console.error('\n[â Œ ERROR: uploadRecording] Transcript generation failed:', err.message);
      }
    });

    return res.status(201).json(
      ApiResponse.created('Recording uploaded successfully', { recording, transcript })
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/recordings
 */
const listRecordings = async (req, res, next) => {
  try {
    handleValidation(req);
    const { page, limit } = req.query;
    const result = await recordingService.getUserRecordings(req.user._id, { page, limit });
    return res.status(200).json(ApiResponse.ok('Recordings fetched', result));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/recordings/:recordingId
 */
const getRecording = async (req, res, next) => {
  try {
    handleValidation(req);
    const recording = await recordingService.getRecordingById(
      req.params.recordingId,
      req.user._id,
      req.user.role
    );
    return res.status(200).json(ApiResponse.ok('Recording fetched', { recording }));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/recordings/:recordingId/transcript
 */
const getRecordingTranscript = async (req, res, next) => {
  try {
    handleValidation(req);
    const recording = await recordingService.getRecordingById(
      req.params.recordingId,
      req.user._id,
      req.user.role
    );
    const transcript = await transcriptService.getRecordingTranscript(recording._id);
    if (!transcript) {
       throw ApiError.notFound('Transcript not found for this recording');
    }
    return res.status(200).json(ApiResponse.ok('Transcript fetched', { transcript }));
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/recordings/:recordingId
 */
const deleteRecording = async (req, res, next) => {
  try {
    handleValidation(req);
    const recording = await recordingService.deleteRecording(
      req.params.recordingId,
      req.user._id,
      req.user.role
    );

    // Clean up Cloudinary asset
    await storageService.deleteFromCloud(recording.cloudPublicId);

    // Clean up Transcript explicitly
    try {
        await transcriptService.deleteTranscriptByRecordingId(recording._id);
    } catch(e) { console.error('No transcript to delete'); }

    return res.status(200).json(ApiResponse.ok('Recording deleted', { id: recording._id }));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/users/:userId/audios
 */
const getUserAudios = async (req, res, next) => {
  try {
    const userId = req.params.userId === 'me' ? req.user._id : req.params.userId;
    const { page, limit } = req.query;
    const result = await recordingService.getUserRecordings(userId, { page, limit });
    return res.status(200).json(ApiResponse.ok('User audios fetched', result));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadRecording,
  listRecordings,
  getRecording,
  getRecordingTranscript,
  deleteRecording,
  getUserAudios,
};
