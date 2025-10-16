import React, { useCallback, useContext, useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext"; // adjust path if your project layout differs

// Fallback base URL if not provided via env
const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const { token, role, username, logout, isLoading } = useContext(AuthContext) || {};

  // local profile state (we don't try to write back into AuthContext)
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // prepare auth headers for requests
  const makeAuthHeaders = useCallback(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  // fetch full profile from backend (endpoint: GET /users/me/)
  const fetchProfile = useCallback(async () => {
    if (!token) {
      setProfileError("No token available to fetch profile.");
      return;
    }
    setLoadingProfile(true);
    setProfileError("");
    try {
      const res = await axios.get(`${BASE_URL}/users/me/`, {
        headers: makeAuthHeaders(),
      });
      // expect res.data to be an object with user fields like { id, username, email, role, ... }
      if (res?.data) {
        setProfile(res.data);
      } else {
        setProfile(null);
        setProfileError("Profile response format unexpected.");
      }
    } catch (err) {
      console.error("fetchProfile error:", err?.response ?? err?.message ?? err);
      setProfile(null);
      setProfileError("Failed to fetch profile. See console.");
    } finally {
      setLoadingProfile(false);
    }
  }, [token, makeAuthHeaders]);

  // If we have a token but no username or profile, fetch it on mount
  useEffect(() => {
    if (token && !profile) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // robust logout: call context logout if available, clear localStorage as extra safety, navigate to admin login
  const handleLogout = useCallback(() => {
    try {
      if (typeof logout === "function") logout();
    } catch (err) {
      console.error("logout() threw an error:", err);
    }

    // extra safety: clear token/role/username from localStorage if present
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
    } catch (err) {
      console.warn("Could not remove items from localStorage:", err);
    }

    // navigate to admin login page
    navigate("/admin-login");
  }, [logout, navigate]);

  // Memoized display values to prevent recalculation on every render
  const displayValues = useMemo(() => {
    const name = profile?.username || username || profile?.email || "Admin";
    const displayRole = profile?.role || role || "—";
    const initials = name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return {
      name,
      role: displayRole,
      initials,
      email: profile?.email || "No email available"
    };
  }, [profile, username, role]);

  // Don't render navbar until auth is initialized
  if (isLoading) {
    return (
      <header className="bg-green-600 text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold">Loan Management Admin</span>
          </div>
          <div className="text-sm opacity-75">Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-green-600 text-white">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <Link to="/admin" className="text-xl font-bold flex items-center space-x-2">
            <span className="inline-block w-8 h-8 rounded-full bg-white text-green-700 flex items-center justify-center font-bold">L</span>
            <span>Loan Management Admin</span>
          </Link>

          {/* Simple navigation links (adjust routes as needed) */}
          <nav className="hidden md:flex items-center space-x-3 ml-6">
            <Link to="/admin" className="px-3 py-1 rounded hover:bg-green-700">Dashboard</Link>
            <Link to="/admin/users" className="px-3 py-1 rounded hover:bg-green-700">Users</Link>
            <Link to="/admin/loans" className="px-3 py-1 rounded hover:bg-green-700">Loans</Link>
          </nav>
        </div>

        {/* Right side: profile & logout */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((s) => !s)}
              className="flex items-center space-x-2 px-3 py-1 rounded hover:bg-green-700"
            >
              <div className="w-8 h-8 rounded-full bg-white text-green-700 flex items-center justify-center font-semibold">
                {displayValues.initials}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium leading-none">{displayValues.name}</div>
                <div className="text-xs opacity-80">{displayValues.role}</div>
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-green-900 rounded shadow-lg z-40">
                <div className="p-3 border-b">
                  <div className="font-semibold">{displayValues.name}</div>
                  <div className="text-sm text-gray-600">{displayValues.email}</div>
                  <div className="text-xs mt-1">Role: {displayValues.role}</div>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => fetchProfile()}
                    disabled={loadingProfile}
                    className="w-full text-left px-3 py-2 rounded hover:bg-green-50"
                  >
                    {loadingProfile ? "Refreshing..." : "Refresh profile"}
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 mt-1 rounded hover:bg-red-50 text-red-600"
                  >
                    Logout
                  </button>
                </div>

                {profileError && <div className="p-2 text-xs text-red-600 border-t">{profileError}</div>}
              </div>
            )}
          </div>

          {/* Optional small mobile button */}
          <div className="md:hidden">
            <button
              onClick={() => navigate("/admin")}
              className="px-3 py-1 rounded hover:bg-green-700"
            >
              Menu
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}