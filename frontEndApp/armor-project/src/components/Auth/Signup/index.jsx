import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
<<<<<<< HEAD
import { useAuth } from '../../../context/AuthContext';
import { registerUser } from '../../../api/auth';
import '../Login/index.css';

const Register = () => {
  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser({ name, email, password });
      // data = { user, token }
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
=======
import '../Login/index.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    navigate('/');
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <Link to="/" className="auth-logo">
          <span className="logo-leaf"><ShieldCheck size={28} color="#10b981" /></span> Armor.ai
        </Link>
        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="subtitle">Join Armor.ai to power up your life</p>
<<<<<<< HEAD

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
              borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
=======
          
          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
                placeholder="Alex Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
<<<<<<< HEAD
                disabled={loading}
=======
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
              />
            </div>
            <div className="input-group">
              <label>Email Address</label>
<<<<<<< HEAD
              <input
                type="email"
=======
              <input 
                type="email" 
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
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
<<<<<<< HEAD
              <input
                type="password"
=======
              <input 
                type="password" 
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
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
            <div className="input-group">
              <label>Confirm Password</label>
<<<<<<< HEAD
              <input
                type="password"
=======
              <input 
                type="password" 
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
<<<<<<< HEAD
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? 'Creating account…' : 'Sign Up'} <span>→</span>
            </button>
          </form>

=======
              />
            </div>
            
            <button type="submit" className="btn-auth">Sign Up <span>→</span></button>
          </form>
          
>>>>>>> dd881948122f09248bf8bacc155ba9069e739fe3
          <p className="auth-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;