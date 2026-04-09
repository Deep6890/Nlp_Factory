import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/auth';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await loginUser({ email, password });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:'var(--bg-page)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-8 no-underline">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background:'var(--green-bg)', border:'1px solid var(--green-border)' }}>
            <Shield size={18} color="var(--green)" />
          </div>
          <span className="text-xl font-black tracking-tight" style={{ color:'var(--text-primary)' }}>
            Armor<span style={{ color:'var(--green)' }}>.ai</span>
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-lg)' }}>
          <h2 className="text-2xl font-black tracking-tight mb-1" style={{ color:'var(--text-primary)' }}>Welcome back</h2>
          <p className="text-sm mb-6" style={{ color:'var(--text-muted)' }}>Sign in to your AI finance dashboard</p>

          {error && (
            <div className="flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-3 mb-4" style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', color:'var(--accent-red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:'var(--text-muted)' }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading}
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none transition-all"
                style={{ background:'var(--bg-input)', border:'1px solid var(--border)', color:'var(--text-primary)' }}
                onFocus={e => e.target.style.borderColor='var(--green)'}
                onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm font-semibold outline-none transition-all"
                  style={{ background:'var(--bg-input)', border:'1px solid var(--border)', color:'var(--text-primary)' }}
                  onFocus={e => e.target.style.borderColor='var(--green)'}
                  onBlur={e => e.target.style.borderColor='var(--border)'} />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all mt-1"
              style={{ background: loading ? 'var(--text-faint)' : 'var(--green)', color:'var(--text-inverse)', border:'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(90,158,47,0.3)' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <p className="text-sm text-center mt-5" style={{ color:'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold no-underline" style={{ color:'var(--green)' }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}


