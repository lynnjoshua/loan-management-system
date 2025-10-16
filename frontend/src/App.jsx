import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Signup from "./pages/Signup";
import LoanList from "./pages/LoanList";
import LoanForm from "./pages/LoanForm";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminNavBar from "./components/AdminNavbar";
import AdminLoanlist from "./pages/AdminLoanlist";
import AdminUsers from "./pages/AdminUsers";
import AdminApprove from "./pages/AdminApprove";
import Dashboard2 from "./pages/Dashboard2";
import Login from "./pages/Login";



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
          
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard2 />} />
          {/* <Route path="/dashboard" element={<Dashboard3 />} />  */}
          {/* <Route path="/dashboard" element={<Dashboard4 />} /> */}

          <Route path="/loans" element={<LoanList />} />
          <Route path="/loans/new" element={<LoanForm />} />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin/loans" element={<AdminLoanlist />} />
          <Route path="/admin/users" element={<AdminUsers />} />          
          <Route path="/admin/approve" element={<AdminApprove />} />          
        </Routes>
      </div>
    </>
  );
}

export default App;