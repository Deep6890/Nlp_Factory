const supabase = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const jwt      = require('jsonwebtoken');

/**
 * Protect routes.
 * Accepts two token types:
 *   1. Supabase-issued JWT  → verified via supabase.auth.getUser()
 *   2. Backend-minted JWT   → verified via jsonwebtoken (iss: 'armor-backend')
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // ── Try backend-minted JWT first (fast, no network) ──────────────────────
    const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      const decoded = jwt.verify(token, secret);
      if (decoded.iss === 'armor-backend') {
        // Ensure profile row exists for backend-registered users too
        await supabase.from('users').upsert({
          id:    decoded.sub,
          name:  decoded.name  || decoded.email?.split('@')[0] || 'User',
          email: decoded.email || '',
          role:  decoded.role  || 'user',
        }, { onConflict: 'id', ignoreDuplicates: true });

        req.user = {
          _id:   decoded.sub,
          name:  decoded.name  || '',
          email: decoded.email || '',
          role:  decoded.role  || 'user',
        };
        return next();
      }
    } catch (_) {
      // Not our token — fall through to Supabase verification
    }

    // ── Try Supabase JWT ──────────────────────────────────────────────────────
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error('[auth] supabase.getUser failed:', error?.message);
      throw ApiError.unauthorized('Invalid or expired token');
    }

    // Ensure users profile row exists (upsert on every request — cheap no-op if already there)
    await supabase.from('users').upsert({
      id:    user.id,
      name:  user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email,
      role:  'user',
    }, { onConflict: 'id', ignoreDuplicates: true });

    const { data: profile } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', user.id)
      .single();

    req.user = {
      _id:   user.id,
      name:  profile?.name  || user.user_metadata?.name || '',
      email: profile?.email || user.email,
      role:  profile?.role  || 'user',
    };

    next();
  } catch (err) {
    next(err.statusCode ? err : ApiError.unauthorized('Invalid or expired token'));
  }
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission'));
  }
  next();
};

module.exports = { protect, restrictTo };
