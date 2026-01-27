import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAdminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await userAdminAPI.login(email, password);
      if (response.success) {
        // Use global login function which updates state and localStorage
        login(response.token, response.user.role, response.user);
        
        // Redirection happens automatically via AppContent's re-render, 
        // but we can also trigger navigation here for a cleaner transition
        if (response.user.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/product-category-management');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-modern">
      <div className="login-container-card">
        <div className="login-brand-section">
          <div className="brand-logo">Y</div>
          <h2>Yelo Command Center</h2>
          <p>Login to access your administration tools</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error-alert">{error}</div>}
          
          <div className="login-form-group">
            <label>Work Email</label>
            <div className="input-with-icon">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                placeholder="admin@yelofashion.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-form-group">
            <label>Master Password</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                className="password-toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Secure Access'}
          </button>

          <p className="login-footer-text">
            Protected by bank-grade encryption.
          </p>
        </form>
      </div>
      
      <div className="login-bg-decoration">
        <div className="circle-1"></div>
        <div className="circle-2"></div>
        <div className="circle-3"></div>
      </div>
    </div>
  );
}

export default Login;
