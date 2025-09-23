// AdminDashboard.jsx
import React, { useEffect, useState, useContext, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export default function AdminDashboard() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState("loans");

  // small helper: ensure we treat role case-insensitively
  const isAdmin = (user && String(user.role || "").toUpperCase() === "ADMIN") || false;

  // create a simple axios instance per call (explicit headers) — easier to debug
  const makeAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // fetch users (admins usually need to see user details)
  const fetchUsers = async () => {
    setLoadingUsers(true);
    setError("");
    try {
      const res = await axios.get(`${BASE_URL}/users/`, {
        headers: { ...makeAuthHeaders() },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchUsers error:", err?.response ?? err?.message ?? err);
      // keep a user-friendly message but don't block the whole dashboard
      setError((prev) => prev || "Failed to load users. Check console for details.");
    } finally {
      setLoadingUsers(false);
    }
  };

  // fetch loans
  const fetchLoans = async () => {
    setLoadingLoans(true);
    setError("");
    try {
      const res = await axios.get(`${BASE_URL}/loans/`, {
        headers: { ...makeAuthHeaders() },
      });
      setLoans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchLoans error:", err?.response ?? err?.message ?? err);
      const serverMsg = err?.response?.data?.detail || err?.response?.data?.error;
      setError(serverMsg || "Failed to load loans. Check console for details.");
    } finally {
      setLoadingLoans(false);
    }
  };

  // load data when we have a token. (This avoids waiting for user object too long)
  useEffect(() => {
    if (!token) {
      // no token → redirect to login (safe fallback)
      // don't automatically navigate if you don't want that; remove if not desired
      return;
    }
    // call both; it's okay if user isn't loaded yet
    fetchUsers();
    fetchLoans();
  }, [token]);

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

  // Basic action handlers (delete / foreclose / approve). Simplified and explicit.
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this loan?")) return;
    setProcessingId(id);
    setError("");
    const prev = loans;
    setLoans((l) => l.filter((x) => x.id !== id));
    try {
      await axios.delete(`${BASE_URL}/loans/${id}/`, { headers: makeAuthHeaders() });
      setSuccess("Loan deleted.");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("delete error:", err);
      setLoans(prev); // rollback
      setError("Failed to delete loan.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleForeclose = async (id) => {
    if (!window.confirm("Foreclose this loan?")) return;
    setProcessingId(id);
    setError("");
    const prev = loans;
    setLoans((ls) => ls.map((x) => (x.id === id ? { ...x, status: "Foreclosed" } : x)));
    try {
      await axios.post(`${BASE_URL}/loans/${id}/foreclose/`, {}, { headers: makeAuthHeaders() });
      setSuccess("Loan foreclosed.");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("foreclose error:", err);
      setLoans(prev); // rollback
      setError("Failed to foreclose.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this loan?")) return;
    setProcessingId(id);
    setError("");
    const prev = loans;
    setLoans((ls) => ls.map((x) => (x.id === id ? { ...x, status: "Approved" } : x)));
    try {
      await axios.post(`${BASE_URL}/loans/${id}/approve/`, {}, { headers: makeAuthHeaders() });
      setSuccess("Loan approved.");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("approve error:", err);
      setLoans(prev); // rollback
      setError("Failed to approve.");
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

  // if user exists and is not admin → show access denied
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen p-6 bg-green-50 text-green-900">
        <div className="bg-red-100 p-4 rounded text-red-700">
          Access denied — admin role required.
        </div>
      </div>
    );
  }

  const totalLoans = loans.length;
  const activeLoans = loans.filter((l) => normalizedStatus(l.status) === "active").length;
  const foreclosedLoans = loans.filter((l) => normalizedStatus(l.status) === "foreclosed").length;
  const pendingLoans = loans.filter((l) => normalizedStatus(l.status) === "pending").length;

  return (
    <div className="min-h-screen bg-green-50 text-green-900">
      {success && <div className="bg-green-100 p-3 text-green-700 text-center">{success}</div>}
      {error && <div className="bg-red-100 p-3 text-red-700 text-center">{error}</div>}

      <div className="p-6 bg-green-600 text-white">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p>Manage loans & users</p>
      </div>

      {/* stats */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="p-4 bg-green-100 rounded">{/* Total */}<div>Total Loans</div><div className="text-2xl">{totalLoans}</div></div>
        <div className="p-4 bg-green-100 rounded"><div>Active</div><div className="text-2xl">{activeLoans}</div></div>
        <div className="p-4 bg-green-100 rounded"><div>Foreclosed</div><div className="text-2xl">{foreclosedLoans}</div></div>
        <div className="p-4 bg-green-100 rounded"><div>Pending</div><div className="text-2xl">{pendingLoans}</div></div>
        <div className="p-4 bg-green-100 rounded flex items-center justify-center">
          <button onClick={() => { fetchLoans(); fetchUsers(); }} disabled={loadingLoans || loadingUsers} className="bg-green-600 text-white px-4 py-2 rounded">
            {(loadingLoans || loadingUsers) ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="px-6 border-b border-green-200 flex space-x-4">
        <button onClick={() => setActiveTab("loans")} className={`py-2 ${activeTab === "loans" ? "border-b-2 border-green-600" : ""}`}>Manage Loans</button>
        <button onClick={() => setActiveTab("users")} className={`py-2 ${activeTab === "users" ? "border-b-2 border-green-600" : ""}`}>Manage Users</button>
      </div>

      {/* Loans tab */}
      {activeTab === "loans" && (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Manage Loans</h2>
          {loadingLoans ? <p>Loading loans...</p> : loans.length === 0 ? <p>No loans found</p> : (
            <div className="overflow-auto">
              <table className="min-w-full bg-white">
                <thead><tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">User</th>
                  <th className="p-2 border">Amount</th>
                  <th className="p-2 border">Tenure</th>
                  <th className="p-2 border">Interest</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Actions</th>
                </tr></thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan.id} className="text-center">
                      <td className="p-2 border">{loan.id}</td>
                      <td className="p-2 border">{displayLoanUser(loan)}</td>
                      <td className="p-2 border">{formatCurrency(loan.amount)}</td>
                      <td className="p-2 border">{loan.tenure} months</td>
                      <td className="p-2 border">{loan.interest_rate}%</td>
                      <td className="p-2 border">{loan.status}</td>
                      <td className="p-2 border space-x-2">
                        <button onClick={() => handleDelete(loan.id)} disabled={processingId !== null} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                        {normalizedStatus(loan.status) === "active" && <button onClick={() => handleForeclose(loan.id)} disabled={processingId !== null} className="px-2 py-1 bg-yellow-500 text-white rounded">Foreclose</button>}
                        {normalizedStatus(loan.status) === "pending" && <button onClick={() => handleApprove(loan.id)} disabled={processingId !== null} className="px-2 py-1 bg-blue-500 text-white rounded">Approve</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Users tab */}
      {activeTab === "users" && (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Manage Users</h2>
          {loadingUsers ? <p>Loading users...</p> : users.length === 0 ? <p>No users found</p> : (
            <div className="overflow-auto">
              <table className="min-w-full bg-white">
                <thead><tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Username</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Joined</th>
                </tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="text-center">
                      <td className="p-2 border">{u.id}</td>
                      <td className="p-2 border">{u.username}</td>
                      <td className="p-2 border">{u.email || "N/A"}</td>
                      <td className="p-2 border">{u.role}</td>
                      <td className="p-2 border">{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
