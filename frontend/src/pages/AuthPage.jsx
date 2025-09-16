import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios"; // your configured axios instance

const AuthPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // keep user-only option in signup UI
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isSignup) {
        // Make sure this path matches your backend route (e.g. /api/register/ or /signup/)
        res = await API.post("/signup/", { username, password, role });
        // Optionally show message and switch to login view
        alert("Signup successful — please login.");
        setIsSignup(false);
        // clear password for security
        setPassword("");
      } else {
        // Login
        // Make sure this path matches your backend route (e.g. /api/login/)
        res = await API.post("/login/", { username, password });

        // Typical response: { access: "...", refresh: "...", role: "user", username: "..." }
        const { access, refresh, role: returnedRole, username: returnedUsername } = res.data;

        if (!access) {
          throw new Error("No access token returned from server.");
        }

        // Persist tokens & user info (consider secure storage & refresh handling)
        localStorage.setItem("token", access);
        if (refresh) localStorage.setItem("refresh", refresh);
        if (returnedRole) localStorage.setItem("role", returnedRole);
        if (returnedUsername) localStorage.setItem("username", returnedUsername);

        // Set default Authorization header for your axios instance so further requests are authenticated
        API.defaults.headers.common["Authorization"] = `Bearer ${access}`;

        // Navigate based on role
        if (returnedRole === "admin") {
          navigate("/admin");
        } else {
          navigate("/loans/new");
        }
      }
    } catch (err) {
      // Best effort to show backend error message, fallback to generic message
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data ||
        err.message ||
        "Authentication failed.";
      setError(String(msg));
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">
        {isSignup ? "Signup" : "Login"}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-live="polite">
        <label className="flex flex-col">
          <span className="text-sm">Username</span>
          <input
            type="text"
            className="border p-2"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Password</span>
          <input
            type="password"
            className="border p-2"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </label>

        {isSignup && (
          <label className="flex flex-col">
            <span className="text-sm">Role</span>
            <select
              className="border p-2"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Choose role"
            >
              <option value="user">User</option>
              {/* do NOT include admin option in public signup UI; admins should be created server-side */}
            </select>
          </label>
        )}

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? (isSignup ? "Signing up..." : "Logging in...") : isSignup ? "Signup" : "Login"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <p
        className="mt-4 text-blue-500 cursor-pointer"
        onClick={() => {
          setError("");
          setIsSignup((s) => !s);
        }}
      >
        {isSignup ? "Already have an account? Login" : "Don't have an account? Signup"}
      </p>
    </div>
  );
};

export default AuthPage;
