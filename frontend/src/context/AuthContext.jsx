import React, { createContext, useCallback, useEffect, useState, useMemo } from "react";
import API from "../api/axios";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- Persist to localStorage ---
  const persistAuth = useCallback((access, refresh, userRole, userName) => {
    if (access) {
      localStorage.setItem("token", access);
      API.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      setToken(access);
    } else {
      localStorage.removeItem("token");
      delete API.defaults.headers.common["Authorization"];
      setToken(null);
    }

    if (refresh) {
      localStorage.setItem("refresh", refresh);
      setRefreshToken(refresh);
    } else {
      localStorage.removeItem("refresh");
      setRefreshToken(null);
    }

    if (userRole !== undefined) {
      localStorage.setItem("role", userRole || "");
      setRole(userRole || null);
    }

    if (userName !== undefined) {
      localStorage.setItem("username", userName || "");
      setUsername(userName || null);
    }
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.clear();
    delete API.defaults.headers.common["Authorization"];
    setToken(null);
    setRefreshToken(null);
    setRole(null);
    setUsername(null);
  }, []);

  // --- Token Refresh (simplified for Django SimpleJWT) ---
  const refreshAccessToken = useCallback(async () => {
    const storedRefresh = refreshToken || localStorage.getItem("refresh");
    if (!storedRefresh) {
      clearAuth();
      return null;
    }

    try {
      const res = await API.post("/auth/token/refresh/", { refresh: storedRefresh });
      const newAccess = res.data.access;
      
      if (newAccess) {
        // Keep existing refresh token unless server sends new one
        const newRefresh = res.data.refresh || storedRefresh;
        persistAuth(newAccess, newRefresh, role, username);
        return newAccess;
      }
    } catch (err) {
      console.error("Token refresh failed:", err);
      clearAuth();
    }
    
    return null;
  }, [refreshToken, persistAuth, role, username, clearAuth]);

  // --- Auto-refresh on 401 errors ---
  useEffect(() => {
    const interceptorId = API.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const newAccess = await refreshAccessToken();
          if (newAccess) {
            originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
            return API(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.response.eject(interceptorId);
    };
  }, [refreshAccessToken]);

  // --- Initialize from localStorage on mount ---
  useEffect(() => {
    const initializeAuth = async () => {
      const storedAccess = localStorage.getItem("token");
      const storedRefresh = localStorage.getItem("refresh");
      const storedRole = localStorage.getItem("role");
      const storedUsername = localStorage.getItem("username");

      // If no token stored, we're done initializing
      if (!storedAccess) {
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      // Restore auth state from localStorage
      // Trust the stored token and let the interceptor handle validation
      // If the token is invalid, the API interceptor will attempt to refresh it
      try {
        API.defaults.headers.common["Authorization"] = `Bearer ${storedAccess}`;

        setToken(storedAccess);
        if (storedRefresh) setRefreshToken(storedRefresh);
        if (storedRole) setRole(storedRole);
        if (storedUsername) setUsername(storedUsername);

      } catch (error) {
        console.error("Error restoring auth state:", error);
        clearAuth();
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [clearAuth]);

  // --- Auth Actions ---
  const signup = useCallback(async (payload) => {
    return API.post("/auth/register/", payload);
  }, []);

  const login = useCallback(async (usernameArg, password) => {
    const res = await API.post("/auth/login/", { username: usernameArg, password });

    // Django SimpleJWT returns: { access, refresh, username, role }
    const accessToken = res.data.access;
    const refresh = res.data.refresh;
    const userRole = res.data.role || null;
    const userName = res.data.username || usernameArg;

    if (accessToken) {
      persistAuth(accessToken, refresh, userRole, userName);
    }

    return res;
  }, [persistAuth]);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const contextValue = useMemo(() => ({
    signup,
    login,
    logout,
    refreshAccessToken,
    token,
    refreshToken,
    role,
    username,
    isInitialized,
    isLoading,
    isAuthenticated: !!token,
  }), [signup, login, logout, refreshAccessToken, token, refreshToken, role, username, isInitialized, isLoading]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export { AuthProvider };