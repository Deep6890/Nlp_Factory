import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
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
          
          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="Alex Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
            <div className="input-group">
              <label>Confirm Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn-auth">Sign Up <span>→</span></button>
          </form>
          
          <p className="auth-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;