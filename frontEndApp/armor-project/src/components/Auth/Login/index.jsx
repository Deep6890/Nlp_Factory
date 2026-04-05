import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { useAuth } from '../../../context/AuthContext';
import { loginUser } from '../../../api/auth';
import './index.css';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser({ email, password });
      // data = { user, token }
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
=======
import { ShieldCheck } from 'lucide-react';
import './index.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'maghrolamayur@gmail.com' && password === 'Mayur@7777') {
      navigate('/dashboard');
    } else {
      alert('Invalid email or password.');
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <Link to="/" className="auth-logo">
          <span className="logo-leaf">🌿</span> Armor.ai
        </Link>
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p className="subtitle">Login to your AI dashboard</p>

<<<<<<< HEAD
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
              borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12,
            }}>
              {error}
            </div>
          )}

=======
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
<<<<<<< HEAD
                disabled={loading}
=======
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
<<<<<<< HEAD
                disabled={loading}
=======
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
              />
            </div>
            <div className="forgot-password">
              <a href="#!">Forgot Password?</a>
            </div>

<<<<<<< HEAD
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'} <span>→</span>
            </button>
=======
            <button type="submit" className="btn-auth">Login <span>→</span></button>
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;