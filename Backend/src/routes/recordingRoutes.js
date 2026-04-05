const { Router }          = require('express');
const recordingController = require('../controllers/recordingController');
const { protect }         = require('../middlewares/authMiddleware');
const { uploadAudio }     = require('../middlewares/uploadMiddleware');
const {
  listRecordingsRules,
  recordingIdParamRules,
} = require('../validations/recordingValidation');

const router = Router();

// All recording routes require authentication
router.use(protect);

// POST /api/v1/recordings/upload
router.post('/upload', uploadAudio, recordingController.uploadRecording);

// GET /api/v1/recordings
router.get('/', listRecordingsRules, recordingController.listRecordings);

// GET /api/v1/recordings/:recordingId
router.get('/:recordingId', recordingIdParamRules, recordingController.getRecording);

// GET /api/v1/recordings/:recordingId/transcript
router.get('/:recordingId/transcript', recordingIdParamRules, recordingController.getRecordingTranscript);

// DELETE /api/v1/recordings/:recordingId
router.delete('/:recordingId', recordingIdParamRules, recordingController.deleteRecording);

module.exports = router;
