import { createContext, useState, useEffect } from "react";
import API from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [username, setUsername] = useState(localStorage.getItem("username") || null);

  // Signup
  const signup = async (username, password, role) => {
    return await API.post("/register/", { username, password, role });
  };

  // Login
  const login = async (username, password) => {
    const res = await API.post("/login/", { username, password });

    localStorage.setItem("token", res.data.access);
    localStorage.setItem("role", res.data.role);
    localStorage.setItem("username", res.data.username);

    setToken(res.data.access);
    setRole(res.data.role);
    setUsername(res.data.username);

    return res;
  };

  // Logout
  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUsername(null);
  };

  // Restore state
  useEffect(() => {
    setToken(localStorage.getItem("token"));
    setRole(localStorage.getItem("role"));
    setUsername(localStorage.getItem("username"));
  }, []);

  return (
    <AuthContext.Provider value={{ signup, login, logout, token, role, username }}>
      {children}
    </AuthContext.Provider>
  );
};
