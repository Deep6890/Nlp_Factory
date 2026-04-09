import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../api/auth';

export default function SignupPage() {
  const [name, setName]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]                   = useState(false);
  const [error, setError]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const data = await registerUser({ name, email, password });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none transition-all";
  const inputStyle = { background:'var(--bg-input)', border:'1px solid var(--border)', color:'var(--text-primary)' };
  const onFocus = e => e.target.style.borderColor = 'var(--green)';
  const onBlur  = e => e.target.style.borderColor = 'var(--border)';

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:'var(--bg-page)' }}>
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-8 no-underline">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background:'var(--green-bg)', border:'1px solid var(--green-border)' }}>
            <Shield size={18} color="var(--green)" />
          </div>
          <span className="text-xl font-black tracking-tight" style={{ color:'var(--text-primary)' }}>
            Armor<span style={{ color:'var(--green)' }}>.ai</span>
          </span>
        </Link>

        <div className="rounded-2xl p-8" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-lg)' }}>
          <h2 className="text-2xl font-black tracking-tight mb-1" style={{ color:'var(--text-primary)' }}>Create account</h2>
          <p className="text-sm mb-6" style={{ color:'var(--text-muted)' }}>Join Armor.ai — your AI finance guardian</p>

          {error && (
            <div className="text-sm font-semibold rounded-xl px-4 py-3 mb-4" style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', color:'var(--accent-red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {[
              { label:'Full Name',    type:'text',  val:name,     set:setName,     ph:'Alex Doe' },
              { label:'Email',        type:'email', val:email,    set:setEmail,    ph:'you@example.com' },
            ].map(({ label, type, val, set, ph }) => (
              <div key={label}>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:'var(--text-muted)' }}>{label}</label>
                <input type={type} value={val} onChange={e => set(e.target.value)} required disabled={loading} placeholder={ph}
                  className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            ))}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading}
                  placeholder="Min 8 characters" className={`${inputCls} pr-11`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:'var(--text-muted)' }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={loading}
                placeholder="••••••••" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all mt-1"
              style={{ background: loading ? 'var(--text-faint)' : 'var(--green)', color:'var(--text-inverse)', border:'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(90,158,47,0.3)' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : 'Create Account →'}
            </button>
          </form>

          <p className="text-sm text-center mt-5" style={{ color:'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-bold no-underline" style={{ color:'var(--green)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}


