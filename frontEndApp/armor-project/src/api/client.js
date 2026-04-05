/**
 * src/api/client.js
 * Central fetch wrapper.  All API helpers import from here.
 *
 * On success  → returns response.data   (the inner payload object)
 * On failure  → throws Error with server's message
 * On 401      → clears token + hard-redirects to /login
 */

const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

// ── token helpers ─────────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem('armor_token');

const handleUnauthorized = () => {
  localStorage.removeItem('armor_token');
  localStorage.removeItem('armor_user');
  window.location.href = '/login';
};

// ── JSON requests ─────────────────────────────────────────────────────────────

/**
 * @param {string} path    e.g. '/auth/login'
 * @param {string} method  'GET' | 'POST' | 'PUT' | 'DELETE'
 * @param {object} [body]  Will be JSON-encoded
 * @returns {Promise<any>} The `data` field from the standardised server response
 */
export const apiFetch = async (path, method = 'GET', body = undefined) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const options = {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new Error('Network error – please check your connection.');
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired. Please log in again.');
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error('Unexpected server response.');
  }

  if (!response.ok || json.success === false) {
    const msg =
      (Array.isArray(json.errors) && json.errors[0]?.msg) ||
      json.message ||
      `Request failed (${response.status})`;
    throw new Error(msg);
  }

  // Backend standard shape: { success, message, data: { ... } }
  return json.data ?? json;
};

// ── Multipart upload ──────────────────────────────────────────────────────────

/**
 * POST a FormData object. Does NOT set Content-Type so the browser can set
 * the correct multipart boundary automatically.
 *
 * @param {string}   path
 * @param {FormData} formData
 * @returns {Promise<any>}
 */
export const apiUpload = async (path, formData) => {
  const token = getToken();

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw new Error('Network error – please check your connection.');
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired. Please log in again.');
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error('Unexpected server response.');
  }

  if (!response.ok || json.success === false) {
    const msg =
      (Array.isArray(json.errors) && json.errors[0]?.msg) ||
      json.message ||
      `Upload failed (${response.status})`;
    throw new Error(msg);
  }

  return json.data ?? json;
};
