import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../theme/ThemeProvider';

export default function Header() {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="site-header">
      <div className="inner">
        <Link to="/" className="brand">Incident Reporter</Link>
        <nav className="nav-actions">
          <button onClick={toggleTheme} className="btn btn-ghost theme-toggle" type="button" aria-label="Toggle dark mode">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          {!auth.user ? (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/signup" className="btn btn-primary">Sign up</Link>
            </>
          ) : (
            <>
              <span style={{ marginRight: 8 }}>{auth.user.name ?? auth.user.email}</span>
              <button onClick={auth.logout} className="btn btn-ghost">Log out</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
