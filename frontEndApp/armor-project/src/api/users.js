/**
 * src/api/users.js
 * ─────────────────────────────────────────────────────────────────────────────
 * User-related API calls (all require authentication).
 */
import { apiFetch } from './client';

/**
 * GET /users/me
 * Returns the full profile of the currently authenticated user.
 * @returns {{ user: object }}
 */
export const getMyProfile = () => apiFetch('/users/me');

/**
 * GET /users/dashboard
 * Returns aggregate stats for the dashboard.
 * @returns {{ stats: object }}
 */
export const getDashboardStats = () => apiFetch('/users/dashboard');

/**
 * PUT /users/profile
 * Updates the user's editable profile fields.
 * @param {object} data  e.g. { name, country, city, ... }
 * @returns {{ user: object }}
 */
export const updateProfile = (data) => apiFetch('/users/profile', 'PUT', data);
