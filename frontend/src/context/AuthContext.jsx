import { createContext, useState, useEffect } from "react";
import API from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);

  // 🔹 Signup
  const signup = async (username, password, role) => {
    return await API.post("/register/", { username, password, role });
  };

  // 🔹 Login
  const login = async (username, password) => {
    const res = await API.post("/login/", { username, password });
    localStorage.setItem("token", res.data.access);
    localStorage.setItem("role", res.data.role);

    setToken(res.data.access);
    setRole(res.data.role);

    return res;
  };

  // 🔹 Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
  };

  // 🔹 Auto-refresh state if localStorage changes
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    if (storedToken) setToken(storedToken);
    if (storedRole) setRole(storedRole);
  }, []);

  return (
    <AuthContext.Provider value={{ signup, login, logout, token, role }}>
      {children}
    </AuthContext.Provider>
  );
};
