import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPath } from '../utils/api';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const allowedSuffix = '@restaurant.local';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail.endsWith(allowedSuffix)) {
        setError(`Use a ${allowedSuffix} email to sign up.`);
        return;
      }

      setError('');
      const response = await fetch(apiPath('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: normalizedEmail, password, storeLocation })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.message ?? 'Signup is currently unavailable.');
        return;
      }

      navigate('/login', { state: { successMessage: 'Account created successfully. Log in with your new credentials.' } });
    } catch {
      setError('Signup is currently unavailable.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <section className="panel signup-panel" style={{ maxWidth: 560, margin: '2rem auto' }}>
        <h2>Sign up</h2>
        <p className="signup-note">Use your restaurant email address to create an account.</p>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 12 }}>
            <label>Name</label>
            <input value={name} onChange={(e) => { setName(e.target.value); setError(''); }} required style={{ width: '100%', padding: 8 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Email</label>
            <input value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} required style={{ width: '100%', padding: 8 }} />
            <small className="signup-hint">Only <strong>@restaurant.local</strong> addresses are accepted.</small>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} required style={{ width: '100%', padding: 8 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Store location</label>
            <input value={storeLocation} onChange={(e) => { setStoreLocation(e.target.value); setError(''); }} required style={{ width: '100%', padding: 8 }} placeholder="Downtown Branch" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
          </div>
          {error && (
            <div className="signup-banner" role="alert">
              <div className="signup-banner-row">
                <strong>Signup blocked</strong>
                <button type="button" className="signup-banner-close" onClick={() => setError('')} aria-label="Dismiss message">
                  ×
                </button>
              </div>
              <span>{error}</span>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
