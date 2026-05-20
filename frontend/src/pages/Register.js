import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ width: 48, height: 48, fontSize: 22, borderRadius: 12, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, margin: '0 auto 16px' }}>T</div>
          <h1>Create account</h1>
          <p>Join Team Task Manager today</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text" className="form-control" placeholder="John Doe"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              required minLength={2}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email" className="form-control" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password" className="form-control" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              required minLength={6}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
