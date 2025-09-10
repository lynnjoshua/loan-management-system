import { useEffect, useState } from "react";
import API from "../api/axios";

const LoanList = () => {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    API.get("/loans/").then((res) => setLoans(res.data));
  }, []);

  const handleForeclose = async (id) => {
    await API.post(`/loans/${id}/foreclose/`);
    setLoans(loans.map(l => l.id === id ? {...l, is_closed: true} : l));
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Loans</h1>
      <ul>
        {loans.map((loan) => (
          <li key={loan.id} className="border p-2 my-2 flex justify-between">
            <span>
              ₹{loan.amount} | {loan.tenure} months | EMI: ₹{loan.monthly_installment} 
              {loan.is_closed && " (Closed)"}
            </span>
            {!loan.is_closed && (
              <button className="bg-red-500 text-white px-2" onClick={() => handleForeclose(loan.id)}>
                Foreclose
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LoanList;
