import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              />
            </div>
            <div className="forgot-password">
              <a href="#!">Forgot Password?</a>
            </div>

            <button type="submit" className="btn-auth">Login <span>→</span></button>
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