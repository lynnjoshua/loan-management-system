import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import AdminNavbar from "../components/AdminNavBar";

const AdminDashboard = () => {
  const { token, logout, user } = useContext(AuthContext);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Axios instance with token
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Verify user is admin
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      setError("Access denied. Admin privileges required.");
      setLoading(false);
    }
  }, [user]);

  // Fetch all loans
  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/loans/");
      setLoans(res.data);
    } catch (err) {
      console.error("❌ Loans API error:", err.response || err.message);
      setError("Failed to fetch loans.");
      if (err.response?.status === 403) {
        setError("Access denied. Admin privileges required.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete loan with confirmation
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this loan?")) {
      return;
    }
    
    try {
      await api.delete(`/loans/${id}/`);
      setLoans(loans.filter((loan) => loan.id !== id));
      setSuccess("Loan deleted successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      alert("Failed to delete loan.");
    }
  };

  // Foreclose loan with confirmation
  const handleForeclose = async (id) => {
    if (!window.confirm("Are you sure you want to foreclose this loan?")) {
      return;
    }
    
    try {
      await api.post(`/loans/${id}/foreclose/`);
      setLoans(
        loans.map((loan) =>
          loan.id === id ? { ...loan, status: "Foreclosed" } : loan
        )
      );
      setSuccess("Loan foreclosed successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      alert("Failed to foreclose loan.");
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchLoans();
    }
  }, [user]);

  if (user && user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-green-50 text-green-900 p-6">
        <div className="bg-red-100 p-4 rounded-md text-red-700">
          {error || "You do not have permission to access this page."}
        </div>
      </div>
    );
  }

  // Stats
  const totalLoans = loans.length;
  const activeLoans = loans.filter((l) => l.status === "Active").length;
  const foreclosedLoans = loans.filter((l) => l.status === "Foreclosed").length;

  return (
    <div className="min-h-screen bg-green-50 text-green-900">
      <AdminNavbar />
      
      {/* Success Message */}
      {success && (
        <div className="bg-green-100 p-4 text-green-700 text-center">
          {success}
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 p-4 text-red-700 text-center">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="p-6 bg-green-600 text-white">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p>Manage all loans in the system</p>
      </div>

      {/* Stats */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-green-100 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Total Loans</h2>
          <p className="text-2xl">{totalLoans}</p>
        </div>
        <div className="p-4 bg-green-100 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Active Loans</h2>
          <p className="text-2xl">{activeLoans}</p>
        </div>
        <div className="p-4 bg-green-100 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Foreclosed Loans</h2>
          <p className="text-2xl">{foreclosedLoans}</p>
        </div>
        <div className="p-4 bg-green-100 rounded-xl shadow flex items-center justify-center">
          <button 
            onClick={fetchLoans}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Loan Table */}
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Manage Loans</h2>
        {loading ? (
          <p>Loading loans...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-green-300 bg-white shadow-md rounded-lg">
              <thead className="bg-green-200">
                <tr>
                  <th className="px-4 py-2 border">Loan ID</th>
                  <th className="px-4 py-2 border">User</th>
                  <th className="px-4 py-2 border">Amount</th>
                  <th className="px-4 py-2 border">Tenure</th>
                  <th className="px-4 py-2 border">Interest Rate</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-2 border text-center">
                      No loans found
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id} className="text-center">
                      <td className="px-4 py-2 border">{loan.id}</td>
                      <td className="px-4 py-2 border">
                        {loan.user?.username || loan.user?.email || loan.user || "N/A"}
                      </td>
                      <td className="px-4 py-2 border">₹{loan.amount}</td>
                      <td className="px-4 py-2 border">{loan.tenure} months</td>
                      <td className="px-4 py-2 border">{loan.interest_rate}%</td>
                      <td className="px-4 py-2 border">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          loan.status === "Active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 border space-x-2">
                        <button
                          onClick={() => handleDelete(loan.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                        {loan.status === "Active" && (
                          <button
                            onClick={() => handleForeclose(loan.id)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                          >
                            Foreclose
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;