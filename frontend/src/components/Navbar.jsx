import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("Logged out successfully!");
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">LoanFriend</h1>
      <div className="space-x-4">
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        <Link to="/loans" className="hover:underline">Loans</Link>
        <Link to="/loans/new" className="hover:underline">New Loan</Link>

        {!token ? (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/signup" className="hover:underline">Signup</Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="hover:underline bg-red-500 px-2 py-1 rounded"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
