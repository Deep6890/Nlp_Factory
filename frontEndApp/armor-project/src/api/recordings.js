/**
 * src/api/recordings.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Recording-related API calls (all require authentication).
 */
import { apiFetch, apiUpload } from './client';

/**
 * GET /recordings
 * @param {{ page?: number, limit?: number }} options
 * @returns {{ audios: object[], total: number, page: number, limit: number }}
 */
export const listRecordings = ({ page = 1, limit = 20 } = {}) =>
  apiFetch(`/recordings?page=${page}&limit=${limit}`);

/**
 * GET /recordings/:recordingId
 * @param {string} recordingId
 * @returns {{ recording: object }}
 */
export const getRecording = (recordingId) =>
  apiFetch(`/recordings/${recordingId}`);

/**
 * GET /recordings/:recordingId/transcript
 * @param {string} recordingId
 * @returns {{ transcript: object }}
 */
export const getRecordingTranscript = (recordingId) =>
  apiFetch(`/recordings/${recordingId}/transcript`);

/**
 * GET /transcripts/insights-summary
 * Aggregated insights across all done transcripts.
 * @returns {{ summary: object }}
 */
export const getInsightsSummary = () =>
  apiFetch('/transcripts/insights-summary');

/**
 * DELETE /recordings/:recordingId
 * @param {string} recordingId
 * @returns {void}
 */
export const deleteRecording = (recordingId) =>
  apiFetch(`/recordings/${recordingId}`, 'DELETE');

/**
 * POST /recordings/upload  (multipart/form-data)
 *
 * @param {File} audioFile       The audio File object
 * @param {object} [meta]        Optional metadata
 * @param {string} [meta.mode]
 * @param {number} [meta.durationSec]
 * @param {string} [meta.recordedAt]  ISO date string
 * @returns {{ recording: object }}
 */
export const uploadRecording = (audioFile, meta = {}) => {
  const form = new FormData();
  form.append('audio', audioFile);
  if (meta.mode)        form.append('mode',        meta.mode);
  if (meta.durationSec) form.append('durationSec', String(meta.durationSec));
  if (meta.recordedAt)  form.append('recordedAt',  meta.recordedAt);
  return apiUpload('/recordings/upload', form);
};
