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
