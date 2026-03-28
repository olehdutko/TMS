import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!login || !password || !userName) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      await register(login, password, userName);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🧪 TMS</h1>
        <p className="subtitle">Create a new account</p>
        {error && <div className="inline-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Display Name <span className="required">*</span></label>
            <input
              className="form-input"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Your full name"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Login <span className="required">*</span></label>
            <input
              className="form-input"
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Choose a unique login"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password <span className="required">*</span></label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Choose a password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
