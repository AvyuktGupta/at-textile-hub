"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ApiError, apiFetch, type ApiResponse } from "@/lib/api";
import { tokenStore } from "@/lib/token-store";
import type { User } from "@/types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useSyncExternalStore<string | null | undefined>(
    tokenStore.subscribe,
    tokenStore.get,
    tokenStore.getServerSnapshot
  );
  const [session, setSession] = useState<{ token: string; user: User } | null>(null);
  const [failedToken, setFailedToken] = useState<string | null>(null);

  const loadUser = useCallback((currentToken: string, isCancelled: () => boolean = () => false) => {
    return apiFetch<ApiResponse<{ user: User }>>("/auth/me", { token: currentToken }).then(
      (res) => {
        if (isCancelled()) return;
        setSession({ token: currentToken, user: res.data.user });
        setFailedToken(null);
      },
      (err) => {
        if (isCancelled()) return;
        if (err instanceof ApiError && err.status === 401) tokenStore.set(null);
        else setFailedToken(currentToken);
      }
    );
  }, []);

  useEffect(() => {
    if (!token || session?.token === token || failedToken === token) return;
    let cancelled = false;
    void loadUser(token, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [token, session?.token, failedToken, loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<ApiResponse<{ token: string; user: User }>>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setSession(res.data);
    tokenStore.set(res.data.token);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setSession(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (token) await loadUser(token);
  }, [token, loadUser]);

  const value = useMemo<AuthContextValue>(() => {
    const user = token && session?.token === token ? session.user : null;
    const pending = token === undefined || (token && !user && failedToken !== token);
    const status: AuthStatus = pending ? "loading" : user ? "authenticated" : "anonymous";
    return {
      status,
      user,
      token: user ? token! : null,
      isAdmin: user?.role === "admin",
      login,
      logout,
      refreshUser,
    };
  }, [token, session, failedToken, login, logout, refreshUser]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
