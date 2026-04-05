/**
 * src/api/auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Auth-related API calls.
 *
 * All functions return the inner `data` payload on success
 * and throw an Error on failure.
 */
import { apiFetch } from './client';

/**
 * POST /auth/login
 * @param {{ email: string, password: string }} credentials
 * @returns {{ user: object, token: string }}
 */
export const loginUser = ({ email, password }) =>
  apiFetch('/auth/login', 'POST', { email, password });

/**
 * POST /auth/register
 * @param {{ name: string, email: string, password: string }} fields
 * @returns {{ user: object, token: string }}
 */
export const registerUser = ({ name, email, password }) =>
  apiFetch('/auth/register', 'POST', { name, email, password });

/**
 * GET /auth/me  (requires valid JWT in localStorage)
 * Used on app load to restore the session.
 * @returns {{ user: object }}
 */
export const getMe = () => apiFetch('/auth/me');
