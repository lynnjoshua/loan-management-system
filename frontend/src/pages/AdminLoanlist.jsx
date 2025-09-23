import { useState, useEffect } from "react";
import API from "../api/axios";

function AdminLoanlist() {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    API.get("/loans/").then((res) => setLoans(res.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Loan List</h1>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-lg shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">User</th>
              <th className="border px-4 py-2">Amount</th>
              <th className="border px-4 py-2">Tenure (Months)</th>
              <th className="border px-4 py-2">Interest Rate (%)</th>
              <th className="border px-4 py-2">Monthly Installment</th>
              <th className="border px-4 py-2">Total Payable</th>
              <th className="border px-4 py-2">Total Interest</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Closed?</th>
            </tr>
          </thead>
          <tbody>
            {loans.length > 0 ? (
              loans.map((loan) => (
                <tr key={loan.id} className="text-center">
                  <td className="border px-4 py-2">{loan.user || "N/A"}</td>
                  <td className="border px-4 py-2">₹{loan.amount}</td>
                  <td className="border px-4 py-2">{loan.tenure}</td>
                  <td className="border px-4 py-2">{loan.interest_rate}%</td>
                  <td className="border px-4 py-2">
                    {loan.monthly_installment || "-"}
                  </td>
                  <td className="border px-4 py-2">{loan.total_payable || "-"}</td>
                  <td className="border px-4 py-2">{loan.total_interest || "-"}</td>
                  <td className="border px-4 py-2">{loan.status}</td>
                  <td className="border px-4 py-2">
                    {loan.is_closed ? "✅" : "❌"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  No loans available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminLoanlist;
