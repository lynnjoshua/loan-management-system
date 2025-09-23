import { createContext, useState, useEffect } from "react";
import API from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem("token");
      const storedRole = localStorage.getItem("role");
      const storedUsername = localStorage.getItem("username");

      console.log("Initializing auth from localStorage:", {
        storedToken,
        storedRole,
        storedUsername,
      });

      if (storedToken) {
        setToken(storedToken);
        setRole(storedRole);
        setUsername(storedUsername);

        // attach token to axios defaults so subsequent requests include Authorization
        API.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      }

      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  /**
   * signup
   * Accepts a single `payload` object:
   * {
   *   username,
   *   password,
   *   role,
   *   email,
   *   profile: { ... }   // optional or empty object
   * }
   *
   * Returns the axios response. Re-throws errors so callers can inspect err.response.data.
   */
  const signup = async (payload) => {
    try {
      const res = await API.post("/register/", payload);
      return res;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Login
  const login = async (usernameArg, password) => {
    try {
      const res = await API.post("/login/", { username: usernameArg, password });

      console.log("Login response:", res.data);

      // adapt to common backend shapes
      const accessToken = res?.data?.access || res?.data?.token || null;
      const userRole = res?.data?.role || res?.data?.user?.role || null;
      const userName = res?.data?.username || res?.data?.user?.username || usernameArg;

      if (accessToken) {
        localStorage.setItem("token", accessToken);
        localStorage.setItem("role", userRole || "");
        localStorage.setItem("username", userName || "");

        setToken(accessToken);
        setRole(userRole || null);
        setUsername(userName || null);

        // attach to axios default headers for subsequent requests
        API.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      }

      return res;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    console.log("Logging out");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");

    setToken(null);
    setRole(null);
    setUsername(null);

    // remove default header
    delete API.defaults.headers.common["Authorization"];
  };

  // Debug info
  useEffect(() => {
    console.log("AuthContext state updated:", { token, role, username });
  }, [token, role, username]);

  return (
    <AuthContext.Provider
      value={{
        signup,
        login,
        logout,
        token,
        role,
        username,
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
