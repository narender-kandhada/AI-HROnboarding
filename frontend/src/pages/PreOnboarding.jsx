import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SumeruLogo from "../assets/sumeru-logo.png";
import { getApiEndpoint } from "../utils/apiConfig";

export default function PreOnboarding() {
  const [empId, setEmpId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const departmentRoles = {
    hr: ["Recruiter", "HR Executive", "Payroll Specialist", "Intern"],
    admin: ["Office Manager", "Facilities Coordinator", "Travel Desk", "Intern"],
    testing: ["QA Analyst", "Automation Engineer", "Test Lead", "Intern"],
    design: ["UI Designer", "UX Researcher", "Graphic Designer", "Intern"],
    development: [
      "Frontend Developer",
      "Backend Developer",
      "Full Stack Developer",
      "DevOps",
      "Intern",
    ],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { emp_id: empId, name: fullName, email, department, role };
    const token = localStorage.getItem("token");
    
    // Check if user is logged in
    if (!token) {
      alert("❌ Please login first. You need to be logged in as HR to create employees.");
      navigate("/hr-login");
      return;
    }
    
    const apiUrl = getApiEndpoint("/employees");
    console.log("📤 Pre-Onboarding - API URL:", apiUrl); // Debug log
    console.log("🔐 Token exists:", !!token); // Debug log

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ Mail sent successfully to ${data.email}`);
        // Optionally reset form or redirect
        setEmpId("");
        setFullName("");
        setEmail("");
        setDepartment("");
        setRole("");
      } else if (res.status === 401) {
        const errorData = await res.json().catch(() => ({}));
        console.error("❌ 401 Error:", errorData);
        alert("❌ Unauthorized: Please login again. Your session may have expired.");
        localStorage.removeItem("token");
        navigate("/hr-login");
      } else if (res.status === 403) {
        const errorData = await res.json().catch(() => ({}));
        alert(`❌ Access Denied: ${errorData.detail || "Only HR department employees can create employees."}`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("❌ Error response:", errorData);
        alert(`❌ Failed to create employee: ${errorData.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      alert("⚠️ Error connecting to backend. Please check your internet connection and try again.");
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
          <h1 className="text-2xl font-bold">🎉 Pre-Onboarding</h1>
          <p className="text-blue-200 font-medium text-sm tracking-wide mt-1">
            Begin your journey with Sumeru Digital
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/hrdashboard")}
            className="bg-white text-blue-800 px-4 py-2 rounded hover:bg-gray-100 transition"
          >
            Home
          </button>
        </div>
      </div>

      {/* Pre-Onboarding Form */}
      <div className="flex items-center justify-center pt-40 pb-20 px-4">
        <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-10 w-full max-w-3xl text-gray-800">
          <h2 className="text-2xl font-bold text-center text-blue-900 mb-4">
            Welcome to Pre-Onboarding 🎊
          </h2>
          <p className="text-center text-gray-500 mb-8">
            We're thrilled to have you join Sumeru Digital! Please fill out your
            details to begin your onboarding journey.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee ID on its own row in grid (not full width) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Employee ID (e.g., SDS00001)"
                value={empId}
                onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                required
                className="w-full p-3 rounded border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-700"
              />
            </div>
            
            {/* Rest of the fields in a 2-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full p-3 rounded border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-700"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 rounded border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-700"
              />

              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setRole("");
                }}
                required
                className="w-full p-3 rounded border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-700"
              >
                <option value="">Select Department</option>
                {Object.keys(departmentRoles).map((dept) => (
                  <option key={dept} value={dept}>
                    {dept.charAt(0).toUpperCase() + dept.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                disabled={!department}
                className="w-full p-3 rounded border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-700 disabled:bg-gray-100"
              >
                <option value="">Select Role</option>
                {department &&
                  departmentRoles[department].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white font-semibold px-10 py-3 rounded transition"
              >
                Send Mail
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-8 border border-blue-200 p-5 rounded-lg bg-blue-50 text-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-blue-900">
              Why this step matters:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Ensures your onboarding journey starts smoothly</li>
              <li>Helps HR assign your onboarding modules correctly</li>
              <li>
                Allows the system to send you your personalized onboarding link
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
