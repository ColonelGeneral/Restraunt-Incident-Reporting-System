import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'incident-reporter-theme';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  });

  function applyTheme(nextTheme: ThemeMode) {
    setThemeState(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: (nextTheme) => applyTheme(nextTheme),
    toggleTheme: () => applyTheme(theme === 'dark' ? 'light' : 'dark')
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}