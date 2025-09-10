import { useEffect, useState } from "react";
import API from "../api/axios";

const Dashboard = () => {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    API.get("/loans/").then((res) => setLoans(res.data));
  }, []);

  const active = loans.filter((l) => !l.is_closed).length;
  const closed = loans.filter((l) => l.is_closed).length;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <p>Total Loans: {loans.length}</p>
      <p>Active Loans: {active}</p>
      <p>Closed Loans: {closed}</p>
    </div>
  );
};

export default Dashboard;
