import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPath } from '../utils/api';

type User = { id: string; name: string; email: string; role: string } | null;

type AuthContextType = {
  user: User;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      // Optionally fetch current user
      fetch(apiPath('/api/auth/me'), { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((data) => setUser(data.user))
        .catch(() => { setUser(null); });
    }
  }, [token]);

  async function login(email: string, password: string) {
    const res = await fetch(apiPath('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    setToken(data.token);
    localStorage.setItem('token', data.token);
    setUser(data.user ?? null);
    navigate('/dashboard');
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    navigate('/');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
