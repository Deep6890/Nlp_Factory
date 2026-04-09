const transcriptService = require('../services/transcriptService');
const ApiResponse       = require('../utils/ApiResponse');
const ApiError          = require('../utils/ApiError');

const listTranscripts = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await transcriptService.getUserTranscripts(req.user._id, { page, limit });
    return res.status(200).json(ApiResponse.ok('Transcripts fetched', result));
  } catch (err) { next(err); }
};

const searchTranscripts = async (req, res, next) => {
  try {
    const results = await transcriptService.searchTranscripts(req.user._id, req.query.q);
    return res.status(200).json(ApiResponse.ok('Search results', { results }));
  } catch (err) { next(err); }
};

const getTranscript = async (req, res, next) => {
  try {
    const transcript = await transcriptService.getTranscriptById(req.params.id, req.user._id, req.user.role);
    return res.status(200).json(ApiResponse.ok('Transcript fetched', { transcript }));
  } catch (err) { next(err); }
};

const deleteTranscript = async (req, res, next) => {
  try {
    await transcriptService.deleteTranscript(req.params.id, req.user._id);
    return res.status(200).json(ApiResponse.ok('Transcript deleted'));
  } catch (err) { next(err); }
};

const getInsightsSummary = async (req, res, next) => {
  try {
    const summary = await transcriptService.getInsightsSummary(req.user._id);
    return res.status(200).json(ApiResponse.ok('Insights summary', { summary }));
  } catch (err) { next(err); }
};

const getFastLimitStatus = async (req, res, next) => {
  try {
    const status = await transcriptService.getFastLimitStatus(req.user._id);
    return res.status(200).json(ApiResponse.ok('Fast limit status', { status }));
  } catch (err) { next(err); }
};

/**
 * PATCH /api/v1/transcripts/:id/insights
 * Allows user to edit the insights JSON for a transcript.
 */
const updateInsights = async (req, res, next) => {
  try {
    const { insights } = req.body;
    if (!insights || typeof insights !== 'object') {
      return next(ApiError.badRequest('insights must be a JSON object'));
    }
    const transcript = await transcriptService.updateInsights(req.params.id, req.user._id, insights);
    return res.status(200).json(ApiResponse.ok('Insights updated', { transcript }));
  } catch (err) { next(err); }
};

module.exports = { listTranscripts, searchTranscripts, getTranscript, deleteTranscript, getInsightsSummary, updateInsights, getFastLimitStatus };
