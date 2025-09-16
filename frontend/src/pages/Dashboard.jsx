import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

const Dashboard = () => {
  const [loans, setLoans] = useState([]);
  const { username } = useContext(AuthContext);



  useEffect(() => {
    API.get("/loans/")  // make sure your axios baseURL handles /api/
      .then((res) => setLoans(res.data))
      .catch((err) => console.error(err));
  }, []);

  const active = loans.filter((l) => !l.is_closed).length;
  const closed = loans.filter((l) => l.is_closed).length;

  return (
    <div className="p-6">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline">
        Smart Loan Tools for Bright Futures
      </h1><br />
      Whether you're planning a purchase or need financial advice, our tools are here to help you make informed decisions.
      <br /><br />
      <h1 className="text-xl font-bold">Dashboard</h1>
      <br />
      <h2 className="text-l font-bold">Hello {username}!</h2>
      <br />
      <p>Total Loans: {loans.length}</p>
      <p>Active Loans: {active}</p>
      <p>Closed Loans: {closed}</p>
    </div>
  );
};

export default Dashboard;
