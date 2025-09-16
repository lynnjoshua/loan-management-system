import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import LoanList from "./pages/LoanList";
import LoanForm from "./pages/LoanForm";
import PingTest from "./pages/PingTest";
import EchoTest from "./pages/EchoTest";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminNavBar from "./components/AdminNavBar";
import AuthPage from "./pages/AuthPage";

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

// Helper component to use useLocation inside BrowserRouter
function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {isAdminRoute ? <AdminNavBar /> : <Navbar />}
      <div className="p-6">
        <Routes>
          <Route path="/ping-test" element={<PingTest />} />
          <Route path="/echo-test" element={<EchoTest />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/loans" element={<LoanList />} />
          <Route path="/loans/new" element={<LoanForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-login" element={<AdminLogin />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
