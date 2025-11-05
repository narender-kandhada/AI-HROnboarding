// src/pages/HrLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SumeruLogo from "../assets/sumeru-logo.png";
import { getApiEndpoint } from "../utils/apiConfig";

export default function HrLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const apiUrl = getApiEndpoint("/auth/hr_login_post");
      console.log("🔐 HR Login - API URL:", apiUrl); // Debug log
      
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("❌ Invalid HR credentials");

      const result = await response.json();
      localStorage.setItem("token", result.access_token);
      console.log("✅ Login successful:", result);
      navigate("/hrdashboard");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#D0DEEB] text-gray-800">
      {/* Header Bar */}
      <div className="bg-blue-950 text-white px-10 py-6 flex flex-col lg:flex-row items-center lg:justify-between shadow-md fixed top-0 left-0 w-full z-50">
        <div className="flex items-center space-x-3">
          <img src={SumeruLogo} alt="Sumeru Logo" className="w-[280px]" />
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
          <h1 className="text-2xl font-bold">👩‍💼 HR Login</h1>
          <p className="text-blue-200 font-medium text-sm tracking-wide mt-1">
            Secure access to your HR dashboard
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="bg-white text-blue-800 px-4 py-2 rounded hover:bg-gray-100 transition"
          >
            Home
          </button>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex items-center justify-center pt-40 pb-20 px-4">
        <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-8 w-full max-w-md text-gray-800">
          <h2 className="text-2xl font-bold text-center text-blue-900 mb-6">
            HR Portal Login
          </h2>
          <p className="text-center text-gray-500 mb-8">
            Please enter your registered email and password
          </p>

          <input
            type="email"
            placeholder="Email Address"
            className="w-full mb-4 p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-6 p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded font-semibold transition"
          >
            Login
          </button>

          <div className="mt-4 text-center text-sm text-gray-500">
            Forgot password?{" "}
            <button
              className="text-blue-700 font-medium hover:underline"
              onClick={() => alert("Please contact admin@sumerudigitals.com")}
            >
              Contact Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
