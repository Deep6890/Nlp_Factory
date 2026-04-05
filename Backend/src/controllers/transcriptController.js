const transcriptService = require('../services/transcriptService');
const ApiResponse       = require('../utils/ApiResponse');
const ApiError          = require('../utils/ApiError');

/**
 * GET /api/v1/transcripts
 * Lists all transcripts for the authenticated user with pagination.
 */
const listTranscripts = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await transcriptService.getUserTranscripts(req.user._id, { page, limit });
    return res.status(200).json(ApiResponse.ok('Transcripts fetched', result));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/transcripts/search?q=keyword
 * Full-text search on transcript text field.
 */
const searchTranscripts = async (req, res, next) => {
  try {
    const results = await transcriptService.searchTranscripts(req.user._id, req.query.q);
    return res.status(200).json(ApiResponse.ok('Search results', { results }));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/transcripts/:id
 * Returns a single transcript by its own _id.
 */
const getTranscript = async (req, res, next) => {
  try {
    const transcript = await transcriptService.getTranscriptById(
      req.params.id,
      req.user._id,
      req.user.role
    );
    return res.status(200).json(ApiResponse.ok('Transcript fetched', { transcript }));
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/transcripts/:id
 * Deletes a transcript by its _id (user-scoped).
 */
const deleteTranscript = async (req, res, next) => {
  try {
    await transcriptService.deleteTranscript(req.params.id, req.user._id);
    return res.status(200).json(ApiResponse.ok('Transcript deleted'));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/transcripts/insights-summary
 * Aggregated insights across all done transcripts for the user.
 */
const getInsightsSummary = async (req, res, next) => {
  try {
    const summary = await transcriptService.getInsightsSummary(req.user._id);
    return res.status(200).json(ApiResponse.ok('Insights summary', { summary }));
  } catch (err) {
    next(err);
  }
};

module.exports = { listTranscripts, searchTranscripts, getTranscript, deleteTranscript, getInsightsSummary };
