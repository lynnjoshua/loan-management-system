import { useState } from "react";
import API from "../api/axios";

const AuthPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // default role
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (isSignup) {
        res = await API.post("/register/", { username, password, role });
        alert("Signup successful! Please login.");
        setIsSignup(false);
      } else {
        res = await API.post("/login/", { username, password });
        localStorage.setItem("token", res.data.access);
        localStorage.setItem("role", res.data.role); // assuming backend returns role
        alert("Login successful!");
        if (res.data.role === "admin") {
          window.location.href = "/admin"; // admin dashboard
        } else {
          window.location.href = "/loans/new"; // user loan form
        }
      }
    } catch (err) {
      setError("Invalid credentials or signup failed.");
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">
        {isSignup ? "Signup" : "Login"}
      </h1>
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

        {isSignup && (
          <select
            className="border p-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        )}

        <button className="bg-blue-500 text-white px-4 py-2">
          {isSignup ? "Signup" : "Login"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <p
        className="mt-4 text-blue-500 cursor-pointer"
        onClick={() => setIsSignup(!isSignup)}
      >
        {isSignup
          ? "Already have an account? Login"
          : "Don't have an account? Signup"}
      </p>
    </div>
  );
};

export default AuthPage;
