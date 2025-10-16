import React, { useEffect, useState, useContext, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AlertBanner from "../components/AlertBanner";
import AdminDashboardHeader from "../components/AdminDashboardHeader";
import AdminStatsCards from "../components/AdminStatsCards";
import TabNavigation from "../components/TabNavigation";
import AdminLoansTable from "../components/AdminLoansTable";
import AdminUsersTable from "../components/AdminUsersTable";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export default function AdminDashboard() {
  const { token, role, isInitialized } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState("loans");
  const [authChecked, setAuthChecked] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Refs for cleanup
  const successTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // small helper: ensure we treat role case-insensitively
  const isAdmin = role && String(role).toUpperCase() === "ADMIN";

  // create a simple axios instance per call (explicit headers) — easier to debug
  const makeAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // fetch users (admins usually need to see user details)
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError("");
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await axios.get(`${BASE_URL}/auth/users/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("fetchUsers error:", err?.response ?? err?.message ?? err);
      setError("Failed to load users. Check console for details.");
    } finally {
      setLoadingUsers(false);
    }
  }, [token]);

  // fetch loans
  const fetchLoans = useCallback(async () => {
    setLoadingLoans(true);
    setError("");
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await axios.get(`${BASE_URL}/loans/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      setLoans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("fetchLoans error:", err?.response ?? err?.message ?? err);
      const serverMsg = err?.response?.data?.detail || err?.response?.data?.error;
      setError(serverMsg || "Failed to load loans. Check console for details.");
    } finally {
      setLoadingLoans(false);
    }
  }, [token]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // load data when we have a token
  useEffect(() => {
    // Wait for AuthContext to initialize before checking auth
    if (!isInitialized) {
      return;
    }

    if (!token) {
      setAuthChecked(true);
      navigate("/admin-login");
      return;
    }

    setAuthChecked(true);
    // call both; it's okay if user isn't loaded yet
    fetchUsers();
    fetchLoans();
  }, [token, isInitialized, navigate, fetchUsers, fetchLoans]);

  // build a map of users by id for quick lookup (handles case where loan.user is id)
  const usersMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      map.set(u.id, u);
    });
    return map;
  }, [users]);

  // format currency helper
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

  const normalizedStatus = (s) => (typeof s === "string" ? s.toLowerCase() : "");

  // Calculate stats (must run before conditional returns to maintain hook order)
  const totalLoans = loans.length;
  const activeLoans = loans.filter((l) => normalizedStatus(l.status) === "approved").length;
  const foreclosedLoans = loans.filter((l) => normalizedStatus(l.status) === "foreclosed").length;
  const pendingLoans = loans.filter((l) => normalizedStatus(l.status) === "pending").length;

  // Filter loans based on selected status (useMemo must always run in same order)
  const filteredLoans = useMemo(() => {
    if (statusFilter === "all") return loans;
    if (statusFilter === "approved") return loans.filter((l) => normalizedStatus(l.status) === "approved");
    if (statusFilter === "foreclosed") return loans.filter((l) => normalizedStatus(l.status) === "foreclosed");
    if (statusFilter === "pending") return loans.filter((l) => normalizedStatus(l.status) === "pending");
    return loans;
  }, [loans, statusFilter]);

  // Handler functions
  const handleRefresh = () => {
    fetchLoans();
    fetchUsers();
  };

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
  };

  // Basic action handlers (delete / foreclose / approve). Simplified and explicit.
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this loan? Note: Loans with payment history cannot be deleted.")) return;
    setProcessingId(id);
    setError("");
    setSuccess("");

    try {
      await axios.delete(`${BASE_URL}/loans/${id}/delete/`, { headers: makeAuthHeaders() });
      setLoans((l) => l.filter((x) => x.id !== id));
      setSuccess("Loan deleted successfully.");
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("delete error:", err);
      // Get detailed error message from server
      const errorMsg = err?.response?.data?.error || err?.response?.data?.detail || "Failed to delete loan.";
      const statusCode = err?.response?.status;

      if (statusCode === 403) {
        setError("Access denied. Admin permissions required to delete loans.");
      } else if (statusCode === 400) {
        setError(errorMsg);
      } else {
        setError(errorMsg);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleForeclose = async (id) => {
    if (!window.confirm("Foreclose this loan?")) return;
    setProcessingId(id);
    setError("");
    setSuccess("");

    try {
      await axios.post(`${BASE_URL}/loans/${id}/foreclose/`, {}, { headers: makeAuthHeaders() });
      setLoans((ls) => ls.map((x) => (x.id === id ? { ...x, status: "Foreclosed" } : x)));
      setSuccess("Loan foreclosed successfully.");
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("foreclose error:", err);
      const errorMsg = err?.response?.data?.error || err?.response?.data?.detail || "Failed to foreclose loan.";
      setError(errorMsg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this loan?")) return;
    setProcessingId(id);
    setError("");
    setSuccess("");

    try {
      await axios.post(`${BASE_URL}/loans/${id}/approve/`, {}, { headers: makeAuthHeaders() });
      setLoans((ls) => ls.map((x) => (x.id === id ? { ...x, status: "Approved" } : x)));
      setSuccess("Loan approved successfully.");
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("approve error:", err);
      const errorMsg = err?.response?.data?.error || err?.response?.data?.detail || "Failed to approve loan.";
      setError(errorMsg);
    } finally {
      setProcessingId(null);
    }
  };

  // helper to display loan's user info whether loan.user is an object, id, or string
  const displayLoanUser = (loan) => {
    const u = loan.user;
    if (!u) return "N/A";
    if (typeof u === "object") return u.username || u.email || u.id || "N/A";
    if (typeof u === "number") {
      const found = usersMap.get(u);
      return found ? found.username || found.email : `User #${u}`;
    }
    // string case (email or username)
    return String(u);
  };

  // Show loading state while checking auth
  if (!authChecked || !isInitialized) {
    return (
      <div className="min-h-screen p-6 bg-green-50 text-green-900 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // if token exists and is not admin → show access denied
  if (token && !isAdmin) {
    return (
      <div className="min-h-screen p-6 bg-green-50 text-green-900">
        <div className="bg-red-100 p-4 rounded text-red-700">
          Access denied — admin role required.
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "loans", label: "Manage Loans" },
    
  ];

  return (
    <div className="min-h-screen bg-green-50 text-green-900">
      <AlertBanner type="success" message={success} />
      <AlertBanner type="error" message={error} />

      <AdminDashboardHeader />

      <AdminStatsCards
        totalLoans={totalLoans}
        activeLoans={activeLoans}
        foreclosedLoans={foreclosedLoans}
        pendingLoans={pendingLoans}
        onRefresh={handleRefresh}
        isRefreshing={loadingLoans || loadingUsers}
        activeFilter={statusFilter}
        onFilterChange={handleFilterChange}
      />

      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "loans" && (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Manage Loans</h2>
          <AdminLoansTable
            loans={filteredLoans}
            isLoading={loadingLoans}
            processingId={processingId}
            onDelete={handleDelete}
            onForeclose={handleForeclose}
            onApprove={handleApprove}
            formatCurrency={formatCurrency}
            displayLoanUser={displayLoanUser}
            normalizedStatus={normalizedStatus}
          />
        </div>
      )}

      {activeTab === "users" && (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Manage Users</h2>
          <AdminUsersTable users={users} isLoading={loadingUsers} />
        </div>
      )}
    </div>
  );
}