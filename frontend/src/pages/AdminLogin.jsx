import { useState } from "react";
import { useNavigate } from "react-router-dom";   //  import useNavigate
import API from "../api/axios";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();   // create navigate function

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/login/", { username, password });
      if (res.data.role !== "ADMIN") {
        setError("Access denied. Admins only.");
        return;
      }
      localStorage.setItem("token", res.data.access);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("username", res.data.username);
      alert("Admin login successful!");
      navigate("/admin");   // redirect using React Router
    } catch (err) {
      setError("Invalid credentials or login failed.");
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">Admin Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          className="border p-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="border p-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-green-500 text-white px-4 py-2">
          Login
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default AdminLogin;
