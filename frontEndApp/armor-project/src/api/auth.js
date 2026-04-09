/**
 * src/api/auth.js
 * Auth via Supabase directly — no backend round-trip for login/register.
 */
import supabase from '../lib/supabase';

/**
 * Sign in with email + password.
 * Returns { user, token } on success, throws on failure.
 */
export const loginUser = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return {
    user:  _mapUser(data.user),
    token: data.session.access_token,
  };
};

/**
 * Register a new user.
 * Returns { user, token } on success, throws on failure.
 */
export const registerUser = async ({ name, email, password }) => {
  // Use backend admin API — creates user without sending any email
  const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Registration failed');
  }
  const { user, token } = json.data;
  // Sync the Supabase client session so it has a valid token
  await supabase.auth.setSession({ access_token: token, refresh_token: token });
  return { user, token };
};

/**
 * Get current authenticated user from Supabase session.
 */
export const getMe = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return { user: _mapUser(user) };
};

const _mapUser = (u) => ({
  id:    u.id,
  _id:   u.id,
  name:  u.user_metadata?.name || u.email?.split('@')[0] || 'User',
  email: u.email,
  role:  u.user_metadata?.role || 'user',
});
