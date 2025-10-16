import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
  const navigate = useNavigate();
  const { token, logout, isLoading } = useAuth();

  const handleLogout = () => {
    logout();
    alert("Logged out successfully!");
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">LoanFriend — Your Loan Management System</h1>
      <div className="space-x-4">
        {token && (
          <>
          </>
        )}

        {isLoading ? (
          <span className="text-sm opacity-75">Loading...</span>
        ) : !token ? (
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