const { Router }           = require('express');
const transcriptController = require('../controllers/transcriptController');
const { protect }          = require('../middlewares/authMiddleware');

const router = Router();

router.use(protect);

// IMPORTANT: /search and /insights-summary must be before /:id to avoid route collision
// GET /api/v1/transcripts/search?q=keyword
router.get('/search', transcriptController.searchTranscripts);

// GET /api/v1/transcripts/insights-summary
router.get('/insights-summary', transcriptController.getInsightsSummary);

// GET /api/v1/transcripts
router.get('/', transcriptController.listTranscripts);

// GET /api/v1/transcripts/:id
router.get('/:id', transcriptController.getTranscript);

// DELETE /api/v1/transcripts/:id
router.delete('/:id', transcriptController.deleteTranscript);

module.exports = router;
