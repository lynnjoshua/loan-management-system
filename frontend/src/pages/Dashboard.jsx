import { useEffect, useState, useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { username } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    API.get("/loans/", { signal: controller.signal })
      .then((res) => {
        setLoans(res?.data || []);
        setError("");
      })
      .catch((err) => {
        if (err.code === "ERR_CANCELED") return;
        console.error("Error fetching loans:", err);
        setError(
          err?.response?.data?.detail || err?.message || "Failed to load loans."
        );
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const totals = useMemo(() => {
    const total = loans.length;
    const active = loans.filter((l) => !l.is_closed).length;
    const closed = loans.filter((l) => l.is_closed).length;
    const totalAmount = loans.reduce((s, l) => s + (Number(l.amount) || 0), 0);
    return { total, active, closed, totalAmount };
  }, [loans]);

  const filteredLoans = useMemo(() => {
    let list = [...loans];
    if (filter === "active") list = list.filter((l) => !l.is_closed);
    if (filter === "closed") list = list.filter((l) => l.is_closed);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (l) =>
          (l.username || "").toLowerCase().includes(q) ||
          String(l.id || "").includes(q) ||
          (l.purpose || "").toLowerCase().includes(q)
      );
    }

    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "amount-desc") {
      list.sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
    } else if (sortBy === "amount-asc") {
      list.sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
    }

    return list;
  }, [loans, filter, query, sortBy]);

  function formatCurrency(v) {
    const n = Number(v) || 0;
    return n.toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  }

  function formatDate(d) {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  const handleView = (id) => {
    navigate(`/loans/${id}`);
  };

  const handleNewLoan = () => navigate("/loans/new");

  const handleCloseLoan = async (loan) => {
    if (loan.is_closed) return;
    const ok = window.confirm("Mark this loan as closed? This action can be reversed by an admin.");
    if (!ok) return;

    try {
      setLoans((prev) => prev.map((l) => (l.id === loan.id ? { ...l, is_closing: true } : l)));
      const res = await API.patch(`/loans/${loan.id}/`, { is_closed: true });
      setLoans((prev) => prev.map((l) => (l.id === loan.id ? { ...res.data } : l)));
    } catch (err) {
      console.error(err);
      alert("Failed to close loan: " + (err?.message || "Unknown error"));
      setLoans((prev) => prev.map((l) => (l.id === loan.id ? { ...l, is_closing: false } : l)));
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Smart Loan Tools for Bright Futures</h1>
            <p className="mt-2 text-sm text-gray-600">Welcome back — here's a snapshot of your loans.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNewLoan}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              New Loan
            </button>
            <Link to="/loans" className="text-sm text-blue-600 hover:underline">Manage all loans</Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Total Loans</p>
            <p className="text-2xl font-bold text-gray-900">{totals.total}</p>
            <p className="mt-2 text-xs text-gray-500">Total value: {formatCurrency(totals.totalAmount)}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Active Loans</p>
            <p className="text-2xl font-bold text-gray-900">{totals.active}</p>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{ width: `${totals.total ? Math.round((totals.active / totals.total) * 100) : 0}%`, backgroundColor: "#2563EB" }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Closed Loans</p>
            <p className="text-2xl font-bold text-gray-900">{totals.closed}</p>
            <p className="mt-2 text-xs text-gray-500">Closed loans are archived but visible for records.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-1/2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username, loan id or purpose"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="amount-desc">Amount: High → Low</option>
              <option value="amount-asc">Amount: Low → High</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-2 rounded-md text-sm ${filter === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-200"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-2 rounded-md text-sm ${filter === "active" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-200"}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("closed")}
              className={`px-3 py-2 rounded-md text-sm ${filter === "closed" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-200"}`}
            >
              Closed
            </button>
          </div>
        </div>

        <div className="mt-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>
          )}

          {loading ? (
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-3 bg-white p-4 rounded shadow">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span className="text-gray-700">Loading loans...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLoans.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <p className="text-gray-700">No loans found. Try adjusting filters or add a new loan.</p>
                  <div className="mt-4">
                    <button onClick={handleNewLoan} className="bg-blue-600 text-white px-4 py-2 rounded-md">Create a loan</button>
                  </div>
                </div>
              ) : (
                filteredLoans.map((loan) => (
                  <div key={loan.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Loan ID: <span className="text-gray-700 font-medium">{loan.id}</span></p>
                          <h3 className="mt-1 text-lg font-bold text-gray-900">{loan.purpose || "Loan"}</h3>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${loan.is_closed ? "text-red-600" : "text-green-600"}`}>
                            {loan.is_closed ? "Closed" : "Active"}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(loan.created_at)}</p>
                        </div>
                      </div>

                      <div className="mt-3 sm:flex sm:items-center sm:gap-6">
                        <p className="text-sm text-gray-600">Borrower: <span className="font-medium text-gray-800">{loan.username || "—"}</span></p>
                        <p className="text-sm text-gray-600">Amount: <span className="font-medium text-gray-800">{formatCurrency(loan.amount)}</span></p>
                        <p className="text-sm text-gray-600">Term: <span className="font-medium text-gray-800">{loan.term_months ? `${loan.term_months} mo` : "—"}</span></p>
                      </div>

                      {loan.notes && <p className="mt-3 text-sm text-gray-500">{loan.notes}</p>}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => handleView(loan.id)} className="px-3 py-1 rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-sm">View</button>
                        {!loan.is_closed && (
                          <button onClick={() => handleCloseLoan(loan)} className="px-3 py-1 rounded-md bg-red-500 text-white text-sm">{loan.is_closing ? "Closing..." : "Close"}</button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">Last updated: {formatDate(loan.updated_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
