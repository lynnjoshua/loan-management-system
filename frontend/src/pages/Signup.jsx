import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Signup = () => {
  const { signup } = useContext(AuthContext);
  const [form, setForm] = useState({ username: "", password: "", role: "user" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(form.username, form.password, form.role);
      alert("Signup successful! Please login.");
      window.location.href = "/login";
    } catch (err) {
      console.error("Signup failed:", err);
      alert("Signup failed. Try again.");
    }
  };

  return (
    <div className="flex flex-col items-center mt-20">
      <h1 className="text-2xl font-bold">Signup</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
        <input
          className="border p-2"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
        />
        <input
          className="border p-2"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="border p-2"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button className="bg-green-500 text-white px-4 py-2">
          Register
        </button>
      </form>
    </div>
  );
};

export default Signup;

