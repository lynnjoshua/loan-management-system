import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Signup = () => {
  const { signup } = useContext(AuthContext);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER",

    // profile fields
    phone_number: "",
    bank_account_number: "",
    ifsc_code: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    pin_code: "",
    date_of_birth: "",
    pan_number: "",
    aadhaar_number: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear inline error on typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required checks for all fields except address_line_2
    if (!form.username.trim()) newErrors.username = "Username is required";
    if (!form.email.trim()) newErrors.email = "Email is required";

    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!form.confirmPassword) newErrors.confirmPassword = "Please confirm password";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    // Profile required fields (except address_line_2)
    if (!form.phone_number.trim()) newErrors.phone_number = "Phone number is required";
    if (!form.bank_account_number.trim()) newErrors.bank_account_number = "Bank account number is required";
    if (!form.ifsc_code.trim()) newErrors.ifsc_code = "IFSC code is required";
    if (!form.address_line_1.trim()) newErrors.address_line_1 = "Address line 1 is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.state.trim()) newErrors.state = "State is required";
    if (!form.pin_code.trim()) newErrors.pin_code = "Pin code is required";
    if (!form.date_of_birth) newErrors.date_of_birth = "Date of birth is required";
    if (!form.pan_number.trim()) newErrors.pan_number = "PAN number is required";
    if (!form.aadhaar_number.trim()) newErrors.aadhaar_number = "Aadhaar number is required";

    // Basic length check for bank account number to catch obvious mistakes
    if (form.bank_account_number && form.bank_account_number.length < 6)
      newErrors.bank_account_number = "Bank account number looks too short";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    // Build payload: match field names expected by backend
    const payload = {
      username: form.username,
      password: form.password,
      role: form.role,
      email: form.email || null,
      profile: {
        phone_number: form.phone_number || "",
        bank_account_number: form.bank_account_number || "",
        ifsc_code: form.ifsc_code || "",
        address_line_1: form.address_line_1 || "",
        address_line_2: form.address_line_2 || "",
        city: form.city || "",
        state: form.state || "",
        pin_code: form.pin_code || "",
        date_of_birth: form.date_of_birth || null,
        pan_number: form.pan_number || "",
        aadhaar_number: form.aadhaar_number || "",
      },
    };

    try {
      await signup(payload);

      alert("Signup successful! Your profile will be reviewed by admin. You will be notified when approved.");
      window.location.href = "/login";
    } catch (err) {
      console.error("Signup failed:", err);

      // If backend returns field errors, map them to UI
      const respData = err?.response?.data;
      if (respData) {
        const serverErrors = {};

        if (typeof respData === "string") {
          alert("Signup failed: " + respData);
        } else {
          Object.entries(respData).forEach(([key, val]) => {
            if (key === "profile" && typeof val === "object") {
              Object.entries(val).forEach(([pkey, pval]) => {
                serverErrors[pkey] = Array.isArray(pval) ? pval.join(" ") : String(pval);
              });
            } else {
              serverErrors[key] = Array.isArray(val) ? val.join(" ") : String(val);
            }
          });

          setErrors((prev) => ({ ...prev, ...serverErrors }));
        }
      } else {
        alert("Signup failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Admin will review new profiles before activation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">

          {/* Basic user fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                className={`mt-1 block w-full px-3 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm`}
                placeholder="Enter username"
              />
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                required
                className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                type="password"
                required
                className={`mt-1 block w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm`}
                placeholder="Enter password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                type="password"
                required
                className={`mt-1 block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm`}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="USER">User</option>
                {/* <option value="ADMIN">Admin</option> */}
              </select>
            </div>
          </div>

          {/* Profile fields (required except address_line_2) */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium text-gray-900">Profile</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  required
                  placeholder="+919999999999"
                  className={`mt-1 block w-full px-3 py-2 border ${errors.phone_number ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm`}
                />
                {errors.phone_number && <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Account Number</label>
                <input
                  name="bank_account_number"
                  value={form.bank_account_number}
                  onChange={handleChange}
                  required
                  className={`mt-1 block w-full px-3 py-2 border ${errors.bank_account_number ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm`}
                />
                {errors.bank_account_number && <p className="mt-1 text-sm text-red-600">{errors.bank_account_number}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">IFSC</label>
                <input
                  name="ifsc_code"
                  value={form.ifsc_code}
                  onChange={(e) => setForm(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                  required
                  placeholder="ABCD0XXXXXX"
                  className={`mt-1 block w-full px-3 py-2 border ${errors.ifsc_code ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm`}
                />
                {errors.ifsc_code && <p className="mt-1 text-sm text-red-600">{errors.ifsc_code}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of birth</label>
                <input
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleChange}
                  type="date"
                  required
                  className={`mt-1 block w-full px-3 py-2 border ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm`}
                />
                {errors.date_of_birth && <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">PAN number</label>
                <input
                  name="pan_number"
                  value={form.pan_number}
                  onChange={(e) => setForm(prev => ({ ...prev, pan_number: e.target.value.toUpperCase() }))}
                  required
                  placeholder="ABCDE1234F"
                  className={`mt-1 block w-full px-3 py-2 border ${errors.pan_number ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm`}
                />
                {errors.pan_number && <p className="mt-1 text-sm text-red-600">{errors.pan_number}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Aadhaar number</label>
                <input
                  name="aadhaar_number"
                  value={form.aadhaar_number}
                  onChange={handleChange}
                  required
                  placeholder="123412341234"
                  className={`mt-1 block w-full px-3 py-2 border ${errors.aadhaar_number ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm`}
                />
                {errors.aadhaar_number && <p className="mt-1 text-sm text-red-600">{errors.aadhaar_number}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address line 1</label>
                <input
                  name="address_line_1"
                  value={form.address_line_1}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
                {errors.address_line_1 && <p className="mt-1 text-sm text-red-600">{errors.address_line_1}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address line 2</label>
                <input
                  name="address_line_2"
                  value={form.address_line_2}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input name="city" value={form.city} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input name="state" value={form.state} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pin code</label>
                <input name="pin_code" value={form.pin_code} onChange={handleChange} required className={`mt-1 block w-full px-3 py-2 border ${errors.pin_code ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm`} />
                {errors.pin_code && <p className="mt-1 text-sm text-red-600">{errors.pin_code}</p>}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </div>

          <div className="text-center">
            <a href="/login" className="text-blue-600 hover:text-blue-500 text-sm">
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;