const { Router }          = require('express');
const recordingController = require('../controllers/recordingController');
const { protect }         = require('../middlewares/authMiddleware');
const { uploadAudio }     = require('../middlewares/uploadMiddleware');
const {
  listRecordingsRules,
  recordingIdParamRules,
} = require('../validations/recordingValidation');

const router = Router();

router.use(protect);

router.post('/upload', uploadAudio, recordingController.uploadRecording);
router.get('/', listRecordingsRules, recordingController.listRecordings);
router.get('/:recordingId', recordingIdParamRules, recordingController.getRecording);
router.get('/:recordingId/transcript', recordingIdParamRules, recordingController.getRecordingTranscript);
router.delete('/:recordingId', recordingIdParamRules, recordingController.deleteRecording);

// POST /api/v1/recordings/:recordingId/retry — re-trigger AI on failed/pending
router.post('/:recordingId/retry', recordingIdParamRules, recordingController.retryTranscript);

module.exports = router;
