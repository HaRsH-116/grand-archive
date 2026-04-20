import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/client";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const rehydrate = useCallback(async () => {
    const token = localStorage.getItem("ga-token");
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authApi.me();
      setUser(data);
    } catch {
      localStorage.removeItem("ga-token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    rehydrate();
    const onUnauth = () => { setUser(null); };
    window.addEventListener("ga:unauthorized", onUnauth);
    return () => window.removeEventListener("ga:unauthorized", onUnauth);
  }, [rehydrate]);

  const login = async (username, password) => {
    const { data } = await authApi.login({ username, password });
    localStorage.setItem("ga-token", data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password, role = "reader") => {
    const { data } = await authApi.register({ username, email, password, role });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("ga-token");
    setUser(null);
  };

  const updateUser = async (updates) => {
    const { data } = await authApi.updateMe(updates);
    setUser(data);
    return data;
  };

  return (
    <AuthCtx.Provider value={{
      user, loading, login, logout, register, updateUser,
      isAdmin:    user?.role === "admin",
      isAuthor:   user?.role === "author" || user?.role === "admin",
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
