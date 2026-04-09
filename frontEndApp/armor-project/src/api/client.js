/**
 * src/api/client.js
 * Central fetch wrapper. Token is read from localStorage directly —
 * works for both Supabase-issued and backend-minted JWTs.
 */

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

// Always read from localStorage — set by AuthContext on login/signup
const getToken = () => localStorage.getItem('armor_token') || null;

const handleUnauthorized = () => {
  localStorage.removeItem('armor_token');
  localStorage.removeItem('armor_user');
  window.location.href = '/login';
};

export const apiFetch = async (path, method = 'GET', body = undefined) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
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
      `Request failed (${response.status})`;
    throw new Error(msg);
  }

  return json.data ?? json;
};

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
