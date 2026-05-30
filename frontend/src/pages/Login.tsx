import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Login() {
  const auth = useAuth();
  const location = useLocation() as { state?: { successMessage?: string } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const successMessage = location.state?.successMessage ?? '';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await auth.login(email, password);
    } catch (err) {
      setError('Login failed. Check credentials or backend.');
    }
  }

  return (
    <div className="app-shell">
      <section className="panel login-shell">
        <div className="login-copy">
          <p className="eyebrow">Restaurant access</p>
          <h2>Sign in to review incidents, analytics, and assigned work.</h2>
          <p className="lead">
            Use a seeded demo account to explore the dashboard, incident lifecycle, AI summaries,
            and reporting tools in seconds.
          </p>

          <div className="login-badge-grid">
            <div className="login-badge">
              <span>Demo employee</span>
              <strong>employee.demo@restaurant.local</strong>
            </div>
            <div className="login-badge">
              <span>Demo manager</span>
              <strong>manager.demo@restaurant.local</strong>
            </div>
            <div className="login-badge">
              <span>Demo admin</span>
              <strong>admin.demo@restaurant.local</strong>
            </div>
          </div>

          <div className="login-preview-card">
            <div>
              <span>Fast start</span>
              <strong>Use Demo@1234! to enter the app</strong>
            </div>
            <Link to="/signup" className="secondary-action">Need an account?</Link>
          </div>
        </div>

        <div className="login-form-card">
          <h3>Log in</h3>
          <p className="login-form-note">Keep it simple: restaurant-only emails are accepted.</p>
          {successMessage && <div className="login-success-banner" role="status">{successMessage}</div>}
          <form onSubmit={submit}>
            <div className="login-field">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@restaurant.local" />
            </div>
            <div className="login-field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Your password" />
            </div>
            {error && (
              <div className="login-banner" role="alert">
                {error}
              </div>
            )}
            <div className="login-actions">
              <button className="btn btn-primary" type="submit">Log in</button>
              <Link to="/" className="btn btn-ghost">Back home</Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
