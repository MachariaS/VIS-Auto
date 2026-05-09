import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../storage';
import type { User } from '@vis/core';

const SESSION_KEY = 'vis-assist-session';

interface AppState {
  user: User | null;
  token: string | null;
  loading: boolean;
  setSession: (user: User, token: string) => Promise<void>;
  clearSession: () => Promise<void>;
}

const AppContext = createContext<AppState>({
  user: null,
  token: null,
  loading: true,
  setSession: async () => {},
  clearSession: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.getItem(SESSION_KEY).then((raw) => {
      if (raw) {
        try {
          const { user: u, token: t } = JSON.parse(raw);
          setUser(u);
          setToken(t);
        } catch {}
      }
      setLoading(false);
    });
  }, []);

  async function setSession(u: User, t: string) {
    setUser(u);
    setToken(t);
    await storage.setItem(SESSION_KEY, JSON.stringify({ user: u, token: t }));
  }

  async function clearSession() {
    setUser(null);
    setToken(null);
    await storage.removeItem(SESSION_KEY);
  }

  return (
    <AppContext.Provider value={{ user, token, loading, setSession, clearSession }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
