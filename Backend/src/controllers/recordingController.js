const recordingService  = require('../services/recordingService');
const storageService    = require('../services/storageService');
const transcriptService = require('../services/transcriptService');
const ApiResponse       = require('../utils/ApiResponse');
const ApiError          = require('../utils/ApiError');
const { validationResult } = require('express-validator');

const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw ApiError.badRequest('Validation failed', errors.array());
};

/**
 * POST /api/v1/recordings/upload
 * Flow: buffer → Supabase Storage → save row → spawn AI → save JSON
 */
const uploadRecording = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest('No audio file provided (field: "audio").');

    const { buffer, mimetype, originalname, size } = req.file;
    const { durationSec, recordedAt } = req.body;

    // 1. Upload to Supabase Storage → get public URL
    const { storageUrl, storagePath } = await storageService.uploadToStorage(
      buffer, mimetype, req.user._id, originalname
    );

    // 2. Save recording row (with storageUrl)
    const recording = await recordingService.createRecording(req.user._id, {
      filename:    originalname || 'audio',
      storageUrl,
      storagePath,
      mimeType:    mimetype,
      size,
      duration:    durationSec ? Number(durationSec) : null,
      recordedAt:  recordedAt  ? new Date(recordedAt) : null,
    });

    // 3. Create pending transcript row
    const transcript = await transcriptService.createPendingTranscript(req.user._id, recording._id);

    // 4. Fire-and-forget: AI downloads from storageUrl → processes → saves JSON
    const mode     = req.body.mode === 'fast' ? 'fast' : 'slow';
    const language = req.body.language || null;  // e.g. 'gu', 'hi', 'ta' — null = auto-detect
    setImmediate(async () => {
      try {
        await transcriptService.processTranscript(req.user._id, recording._id, storageUrl, mode, language);
      } catch (err) {
        console.error('[AI] Transcript failed:', err.message);
      }
    });

    return res.status(201).json(
      ApiResponse.created('Uploaded. AI is processing.', { recording, transcript })
    );
  } catch (err) { next(err); }
};

const listRecordings = async (req, res, next) => {
  try {
    handleValidation(req);
    const result = await recordingService.getUserRecordings(req.user._id, req.query);
    return res.status(200).json(ApiResponse.ok('Recordings fetched', result));
  } catch (err) { next(err); }
};

const getRecording = async (req, res, next) => {
  try {
    handleValidation(req);
    const recording = await recordingService.getRecordingById(req.params.recordingId, req.user._id, req.user.role);
    return res.status(200).json(ApiResponse.ok('Recording fetched', { recording }));
  } catch (err) { next(err); }
};

const getRecordingTranscript = async (req, res, next) => {
  try {
    handleValidation(req);
    const recording = await recordingService.getRecordingById(req.params.recordingId, req.user._id, req.user.role);
    const transcript = await transcriptService.getRecordingTranscript(recording._id);
    if (!transcript) throw ApiError.notFound('Transcript not found');
    return res.status(200).json(ApiResponse.ok('Transcript fetched', { transcript }));
  } catch (err) { next(err); }
};

const deleteRecording = async (req, res, next) => {
  try {
    handleValidation(req);
    const recording = await recordingService.deleteRecording(req.params.recordingId, req.user._id, req.user.role);
    // Delete from Supabase Storage
    await storageService.deleteFromStorage(recording.storagePath);
    // Delete transcript
    await transcriptService.deleteTranscriptByRecordingId(recording._id).catch(() => {});
    return res.status(200).json(ApiResponse.ok('Recording deleted', { id: recording._id }));
  } catch (err) { next(err); }
};

const getUserAudios = async (req, res, next) => {
  try {
    const userId = req.params.userId === 'me' ? req.user._id : req.params.userId;
    const result = await recordingService.getUserRecordings(userId, req.query);
    return res.status(200).json(ApiResponse.ok('Audios fetched', result));
  } catch (err) { next(err); }
};

const retryTranscript = async (req, res, next) => {
  try {
    handleValidation(req);
    const recording = await recordingService.getRecordingById(req.params.recordingId, req.user._id, req.user.role);
    // Reset transcript status to pending
    const supabase = require('../config/supabase');
    await supabase.from('transcripts')
      .update({ status: 'pending', error_message: null })
      .eq('recording_id', recording._id);

    // Re-trigger AI
    const mode     = req.body.mode === 'fast' ? 'fast' : 'slow';
    const language = req.body.language || null;
    setImmediate(async () => {
      try {
        await transcriptService.processTranscript(req.user._id, recording._id, recording.storageUrl, mode, language);
      } catch (err) {
        console.error('[AI] Retry failed:', err.message);
      }
    });

    return res.status(200).json(ApiResponse.ok('Retry started — AI is processing', { recordingId: recording._id }));
  } catch (err) { next(err); }
};

module.exports = { uploadRecording, listRecordings, getRecording, getRecordingTranscript, deleteRecording, getUserAudios, retryTranscript };
