/**
 * src/api/transcripts.js
 * Transcript-related API calls (all require authentication).
 */
import { apiFetch } from './client';

/** GET /transcripts */
export const listTranscripts = ({ page = 1, limit = 20 } = {}) =>
  apiFetch(`/transcripts?page=${page}&limit=${limit}`);

/** GET /transcripts/search?q=keyword */
export const searchTranscripts = (q) =>
  apiFetch(`/transcripts/search?q=${encodeURIComponent(q)}`);

/** GET /transcripts/:id */
export const getTranscript = (id) => apiFetch(`/transcripts/${id}`);

/** DELETE /transcripts/:id */
export const deleteTranscript = (id) => apiFetch(`/transcripts/${id}`, 'DELETE');

/**
 * PATCH /transcripts/:id/insights
 * Update the insights JSON for a transcript (interactive editor).
 * @param {string} id
 * @param {object} insights
 */
export const updateInsights = (id, insights) =>
  apiFetch(`/transcripts/${id}/insights`, 'PATCH', { insights });

/**
 * POST /reports/generate
 * Generate a PDF/markdown report for the last N days
 */
export const generateReport = (days = 10) =>
  apiFetch('/reports/generate', 'POST', { days });
