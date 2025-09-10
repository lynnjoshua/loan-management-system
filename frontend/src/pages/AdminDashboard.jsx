import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const AdminDashboard = () => {
  const { token, logout } = useContext(AuthContext);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Axios instance with token
  const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Fetch all loans
  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await api.get("/loans/");
      setLoans(res.data);
    } catch (err) {
      setError("Failed to fetch loans.");
    } finally {
      setLoading(false);
    }
  };

  // Delete loan
  const handleDelete = async (id) => {
    try {
      await api.delete(`/loans/${id}/`);
      setLoans(loans.filter((loan) => loan.id !== id));
    } catch (err) {
      alert("Failed to delete loan.");
    }
  };

  // Foreclose loan
  const handleForeclose = async (id) => {
    try {
      await api.post(`/loans/${id}/foreclose/`);
      setLoans(
        loans.map((loan) =>
          loan.id === id ? { ...loan, status: "Foreclosed" } : loan
        )
      );
    } catch (err) {
      alert("Failed to foreclose loan.");
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Stats
  const totalLoans = loans.length;
  const activeLoans = loans.filter((l) => l.status === "Active").length;
  const foreclosedLoans = loans.filter((l) => l.status === "Foreclosed").length;

  return (
    <div className="min-h-screen bg-green-50 text-green-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-green-200 shadow-md">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="bg-green-700 text-white px-4 py-2 rounded-lg shadow hover:bg-green-800"
        >
          Logout
        </button>
      </header>

      {/* Stats */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {loans.map((loan) => (
                  <tr key={loan.id} className="text-center">
                    <td className="px-4 py-2 border">{loan.id}</td>
                    <td className="px-4 py-2 border">{loan.user || "N/A"}</td>
                    <td className="px-4 py-2 border">₹{loan.amount}</td>
                    <td className="px-4 py-2 border">{loan.tenure} months</td>
                    <td className="px-4 py-2 border">{loan.interest_rate}%</td>
                    <td className="px-4 py-2 border">{loan.status}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
