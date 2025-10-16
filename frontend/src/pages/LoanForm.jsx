import { useState } from "react";
import API from "../api/axios";

const LoanForm = () => {
  const [form, setForm] = useState({ amount:"", tenure:"", interest_rate:"" });
  const [result, setResult] = useState(null); // store backend response

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/loans/", form);
      setResult(res.data);  // backend returns loan with EMI, totals
    } catch (err) {
      console.error(err);
      alert("Error creating loan");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Request a New Loan</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input className="border p-2" name="amount" placeholder="Amount (from 1000 to 100,000)"
          value={form.amount} onChange={handleChange} />
        <input className="border p-2" name="tenure" placeholder="Tenure (from 3 to 24 months)"
          value={form.tenure} onChange={handleChange} />
        {/* <input className="border p-2" name="interest_rate" placeholder="Interest Rate %"
          value={form.interest_rate} onChange={handleChange} /> */}
        <button className="bg-blue-500 text-white px-4 py-2">Submit</button>
      </form>

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold text-lg mb-2">Loan Summary</h2>
          <p><b>Monthly EMI:</b> {result.monthly_installment}</p>
          <p><b>Total Payable:</b> {result.total_payable}</p>
          <p><b>Total Interest:</b> {result.total_interest}</p>
        </div>
      )}
    </div>
  );
};

export default LoanForm;
