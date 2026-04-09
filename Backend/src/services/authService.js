const supabase = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const jwt      = require('jsonwebtoken');

/**
 * Register a new user.
 * Uses admin.createUser (email_confirm:true) so zero emails are sent.
 * Returns a signed JWT directly — no signInWithPassword needed.
 */
const signUp = async ({ name, email, password }) => {
  // 1. Create confirmed user via admin API (no email sent)
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authErr) {
    const msg = authErr.message?.toLowerCase() || '';
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('unique')) {
      throw ApiError.conflict('Email is already registered');
    }
    throw ApiError.internal(authErr.message);
  }

  const userId = authData.user.id;

  // 2. Upsert profile row (ignore error if tables not ready yet)
  await supabase
    .from('users')
    .upsert({ id: userId, name: name.trim(), email: email.toLowerCase().trim(), role: 'user' })
    .then(({ error }) => { if (error) console.warn('[signUp] profile upsert:', error.message); });

  // 3. Generate token via admin.generateLink — gives us a valid session without email
  const token = _mintToken(userId, email);

  return {
    user:  { id: userId, _id: userId, name: name.trim(), email, role: 'user' },
    token,
  };
};

/**
 * Log in an existing user.
 */
const logIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw ApiError.unauthorized('Invalid email or password');

  const userId = data.user.id;

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', userId)
    .single();

  const user = profile
    ? { id: userId, _id: userId, name: profile.name, email: profile.email, role: profile.role }
    : { id: userId, _id: userId, name: data.user.user_metadata?.name || '', email, role: 'user' };

  return { user, token: data.session.access_token };
};

/**
 * Mint a plain JWT the backend can verify itself.
 * Used for admin-created users where Supabase session isn't available.
 */
const _mintToken = (userId, email) => {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return jwt.sign(
    { sub: userId, email, role: 'user', iss: 'armor-backend' },
    secret,
    { expiresIn: '7d' }
  );
};

module.exports = { signUp, logIn };
