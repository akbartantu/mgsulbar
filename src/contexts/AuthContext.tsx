import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@/types/mail';
import { api, setAuthTokenGetter } from '@/lib/api';

const STORAGE_KEY = 'mgsulbar_token';

const bypassLogin = import.meta.env.VITE_BYPASS_LOGIN === 'true';

const GUEST_USER: User = { id: 'guest', name: 'Guest', email: '', role: 'viewer' };

/** JWT has exactly 3 base64url segments separated by dots. */
function isJwtShape(value: string | null): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.split('.').length === 3;
}

function getStoredToken(): string | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!isJwtShape(raw)) {
    if (raw != null) sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
  return raw!.trim();
}

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  needRegister: boolean;
  /** Pass token and optionally user from login/register response to skip getMe() call. */
  login: (token: string, user?: User) => void;
  logout: () => void;
  clearNeedRegister: () => void;
  /** Refetch current user from API (e.g. after profile edit). */
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => (bypassLogin ? null : getStoredToken()));
  const [user, setUser] = useState<User | null>(() => (bypassLogin ? GUEST_USER : null));
  const [needRegister, setNeedRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(() => !bypassLogin);

  const fetchUser = useCallback(async (authToken: string) => {
    setAuthTokenGetter(() => authToken);
    setNeedRegister(false);
    setIsLoading(true);
    try {
      const me = await api.getMe();
      setUser(me);
      setNeedRegister(false);
    } catch (err) {
      const e = err as Error & { needRegister?: boolean };
      if (e?.needRegister) {
        setUser(null);
        setNeedRegister(true);
      } else {
        setToken(null);
        sessionStorage.removeItem(STORAGE_KEY);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (bypassLogin) {
      setAuthTokenGetter(() => () => null);
      api.setup().catch(() => {});
      return;
    }
    setAuthTokenGetter(getStoredToken);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    if (user) {
      setIsLoading(false);
      return;
    }
    fetchUser(token);
  }, [token, fetchUser, user]);

  const login = useCallback((authToken: string, userFromApi?: User) => {
    const normalized = typeof authToken === 'string' ? authToken.trim() : '';
    if (!isJwtShape(normalized)) return;
    sessionStorage.setItem(STORAGE_KEY, normalized);
    setAuthTokenGetter(getStoredToken);
    setToken(normalized);
    if (userFromApi != null) {
      setUser(userFromApi);
      setNeedRegister(false);
    }
    api.setup().catch(() => {});
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(bypassLogin ? GUEST_USER : null);
    setNeedRegister(false);
    setAuthTokenGetter(() => () => null);
  }, []);

  const clearNeedRegister = useCallback(() => setNeedRegister(false), []);

  const refreshUser = useCallback(() => {
    if (token) fetchUser(token);
  }, [token, fetchUser]);

  const value: AuthContextValue = { user, isLoading, needRegister, login, logout, clearNeedRegister, refreshUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
