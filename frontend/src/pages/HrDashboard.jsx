import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaUserPlus, FaChartPie, FaListAlt, FaFileExcel, FaDownload, FaSignOutAlt } from "react-icons/fa";
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import SumeruLogo from "../assets/sumeru-logo.png";
import { getApiUrl } from "../utils/apiConfig";

const HrDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [employeeStats, setEmployeeStats] = useState({});
  const [departmentData, setDepartmentData] = useState([]);
  const [onboardingData, setOnboardingData] = useState([]);
  const [recentJoinees, setRecentJoinees] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({ avg: 0, count: 0 });
  const [allEmployees, setAllEmployees] = useState([]);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [defaultEmailAccount, setDefaultEmailAccount] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    email: "",
    password: "",
    display_name: "",
    notes: ""
  });
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [passwordResetData, setPasswordResetData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [showEmailAccountManagement, setShowEmailAccountManagement] = useState(false);
  const [currentHRUser, setCurrentHRUser] = useState({ name: "", role: "" });
  const apiUrl = getApiUrl();

  // 🎯 Fetch All Data
  useEffect(() => {
    fetchAllDashboardData();
    fetchEmailAccounts();
    fetchCurrentHRUser();
  }, []);

  const fetchCurrentHRUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/hr-login");
        return;
      }

      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const userData = await res.json();
        setCurrentHRUser({
          name: userData.name || "",
          role: userData.role || "HR"
        });
      } else {
        // If token is invalid, redirect to login
        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/hr-login");
        }
      }
    } catch (err) {
      console.error("Error fetching current HR user:", err);
    }
  };

  const fetchEmailAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [accountsRes, defaultRes] = await Promise.all([
        fetch(`${apiUrl}/email-accounts/`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${apiUrl}/email-accounts/default`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ ok: false }))
      ]);

      if (accountsRes.ok) {
        const accounts = await accountsRes.json();
        setEmailAccounts(accounts);
      }

      if (defaultRes.ok) {
        const defaultAccount = await defaultRes.json();
        setDefaultEmailAccount(defaultAccount);
      }
    } catch (err) {
      console.error("Error fetching email accounts:", err);
    }
  };

  const fetchAllDashboardData = async () => {
    try {
      setLoading(true);
      const [empRes, fbRes] = await Promise.all([
        fetch(`${apiUrl}/employees`),
        fetch(`${apiUrl}/feedback`).catch(() => null)
      ]);

      const employees = await empRes.json();
      const feedbacks = fbRes ? await fbRes.json() : [];

      setAllEmployees(employees);
      setAllFeedbacks(feedbacks);

      // Helper function to check if employee has completed all tasks
      const hasCompletedAllTasks = (emp) => {
        const tasks = emp.tasks || [];
        return tasks.length > 0 && tasks.every(t => t.status === "completed");
      };

      // Employee Stats
      const total = employees.length;
      const males = employees.filter(e => e.personal_info?.gender === "Male").length;
      const females = employees.filter(e => e.personal_info?.gender === "Female").length;
      // Count employees who completed all tasks OR have status as completed
      const completed = employees.filter(e => hasCompletedAllTasks(e) || e.status === "completed").length;
      // Count all employees that are not completed as pending (includes "pending", "personal-details", "active", etc.)
      // Exclude "disabled" from counts but include everything else as pending
      const pending = employees.filter(e => !hasCompletedAllTasks(e) && e.status !== "completed" && e.status !== "disabled").length;

      setEmployeeStats({ total, males, females, completed, pending });

      // Department Distribution (normalize to avoid duplicates)
      const normalizeDepartment = (dept) => {
        if (!dept) return "";
        // Normalize: trim whitespace, handle common acronyms (HR, IT, etc.)
        const trimmed = dept.trim();
        // Common department acronyms that should be all caps
        const acronyms = ["HR", "IT", "AI", "ML", "UI", "UX", "QA", "R&D"];
        const upper = trimmed.toUpperCase();
        if (acronyms.includes(upper)) {
          return upper;
        }
        // Otherwise, capitalize first letter of each word
        return trimmed.split(/\s+/).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(" ");
      };
      
      const deptMap = {};
      employees.forEach(emp => {
        if (emp.department) {
          const normalized = normalizeDepartment(emp.department);
          deptMap[normalized] = (deptMap[normalized] || 0) + 1;
        }
      });
      setDepartmentData(
        Object.entries(deptMap).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name))
      );

      // Onboarding Progress
      setOnboardingData([
        { name: "Completed", value: completed },
        { name: "Pending", value: pending }
      ]);

      // Recent Joiners
      setRecentJoinees(employees.slice(-5).reverse());

      // Feedback Stats
      const avg = feedbacks.length
        ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
        : 0;
      setFeedbackStats({ avg, count: feedbacks.length });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Export Employee Data to Excel
  const exportEmployeesToExcel = () => {
    const wsData = allEmployees.map(emp => ({
      "Emp ID": emp.emp_id || "N/A",
      "Name": emp.name || "N/A",
      "Email": emp.email || "N/A",
      "Role": emp.role || "N/A",
      "Department": emp.department || "N/A",
      "Status": emp.status || "N/A",
      "Gender": emp.personal_info?.gender || "N/A",
      "Mobile": emp.personal_info?.mobile || "N/A",
      "DOB": emp.personal_info?.dob || "N/A",
      "PAN": emp.personal_info?.pan_number || "N/A",
      "Aadhaar": emp.personal_info?.aadhaar_number || "N/A"
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    
    // Add Statistics Sheet
    const statsData = [
      ["Metric", "Value"],
      ["Total Employees", employeeStats.total || 0],
      ["Male Employees", employeeStats.males || 0],
      ["Female Employees", employeeStats.females || 0],
      ["Completed Onboarding", employeeStats.completed || 0],
      ["Pending Onboarding", employeeStats.pending || 0],
      ["Average Feedback Rating", feedbackStats.avg || 0],
      ["Total Feedbacks", feedbackStats.count || 0]
    ];
    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsWs, "Statistics");

    // Add Department Distribution Sheet
    const deptSheetData = [["Department", "Count"], ...departmentData.map(d => [d.name, d.value])];
    const deptWs = XLSX.utils.aoa_to_sheet(deptSheetData);
    XLSX.utils.book_append_sheet(wb, deptWs, "Department Distribution");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `employee_data_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export Statistics to Excel
  const exportStatisticsToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Statistics Sheet
    const statsData = [
      ["Metric", "Value"],
      ["Total Employees", employeeStats.total || 0],
      ["Male Employees", employeeStats.males || 0],
      ["Female Employees", employeeStats.females || 0],
      ["Completed Onboarding", employeeStats.completed || 0],
      ["Pending Onboarding", employeeStats.pending || 0],
      ["Average Feedback Rating", feedbackStats.avg || 0],
      ["Total Feedbacks", feedbackStats.count || 0]
    ];
    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsWs, "Statistics");

    // Department Distribution
    const deptSheetData = [["Department", "Count"], ...departmentData.map(d => [d.name, d.value])];
    const deptWs = XLSX.utils.aoa_to_sheet(deptSheetData);
    XLSX.utils.book_append_sheet(wb, deptWs, "Department Distribution");

    // Onboarding Progress
    const onboardingSheetData = [["Status", "Count"], ...onboardingData.map(d => [d.name, d.value])];
    const onboardingWs = XLSX.utils.aoa_to_sheet(onboardingSheetData);
    XLSX.utils.book_append_sheet(wb, onboardingWs, "Onboarding Progress");

    // Feedback Data (if available)
    if (allFeedbacks.length > 0) {
      const feedbackSheetData = [
        ["ID", "Rating", "Message", "Submitted At"],
        ...allFeedbacks.map(f => [f.id || "", f.rating || "", f.message || "", f.submitted_at || ""])
      ];
      const feedbackWs = XLSX.utils.aoa_to_sheet(feedbackSheetData);
      XLSX.utils.book_append_sheet(wb, feedbackWs, "Feedback");
    }

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `dashboard_statistics_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const COLORS = ["#2563EB", "#10B981", "#F43F5E", "#FBBF24", "#8B5CF6"];

  // Logout handler
  const handleAddEmailAccount = () => {
    setEmailFormData({ email: "", password: "", display_name: "", notes: "" });
    setShowEmailModal(true);
  };

  const handleSetDefaultEmail = async (accountId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login again");
        navigate("/hr-login");
        return;
      }

      const res = await fetch(`${apiUrl}/email-accounts/${accountId}/set-default`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Default email account updated successfully!");
        fetchEmailAccounts();
      } else {
        const error = await res.json();
        alert(`Failed: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error setting default email:", error);
      alert("Failed to update default email account.");
    }
  };

  const handleSubmitEmailAccount = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login again");
        navigate("/hr-login");
        return;
      }

      const payload = {
        email: emailFormData.email,
        password: emailFormData.password,
        display_name: emailFormData.display_name || null,
        notes: emailFormData.notes || null,
        is_default: emailAccounts.length === 0 ? "yes" : "no"  // First account becomes default
      };

      const res = await fetch(`${apiUrl}/email-accounts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Email account added successfully!");
        setShowEmailModal(false);
        setEmailFormData({ email: "", password: "", display_name: "", notes: "" });
        fetchEmailAccounts();
      } else {
        const error = await res.json();
        alert(`Failed: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding email account:", error);
      alert("Failed to add email account. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/hr-login");
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!passwordResetData.old_password || !passwordResetData.new_password || !passwordResetData.confirm_password) {
      alert("All fields are required");
      return;
    }
    
    if (passwordResetData.new_password !== passwordResetData.confirm_password) {
      alert("New password and confirm password do not match");
      return;
    }
    
    if (passwordResetData.new_password.length < 6) {
      alert("New password must be at least 6 characters long");
      return;
    }
    
    if (passwordResetData.old_password === passwordResetData.new_password) {
      alert("New password must be different from old password");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login again");
        navigate("/hr-login");
        return;
      }
      
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(passwordResetData)
      });
      
      if (res.ok) {
        alert("Password reset successfully! Please login again with your new password.");
        setShowPasswordResetModal(false);
        setPasswordResetData({ old_password: "", new_password: "", confirm_password: "" });
        // Logout after successful password reset
        handleLogout();
      } else {
        const error = await res.json();
        alert(`Failed: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to reset password. Please try again.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const cardVariants = {
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#E8F0FA] text-gray-800">
      {/* Header - Fixed */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 bg-blue-950 text-white px-6 py-5 flex justify-between items-center shadow-md z-50"
      >
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FaBars className="text-xl" />
          </motion.button>
          <img src={SumeruLogo} alt="Sumeru" style={{ width: "280px" }} className="drop-shadow-md" />
        </div>
        <h2 className="text-lg font-semibold">Welcome to HR Dashboard 👋</h2>
        <div className="flex items-center gap-3">
          <motion.img
            whileHover={{ scale: 1.1, rotate: 5 }}
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentHRUser.name || "HR User")}&background=ffffff&color=0D8ABC`}
            alt="Profile"
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <p className="text-sm font-medium">{currentHRUser.name || "Loading..."}</p>
            <p className="text-xs text-blue-200">{currentHRUser.role || "HR"}</p>
          </div>
        </div>
      </motion.div>

      {/* Layout */}
      <div className="pt-[80px]">
        {/* Sidebar - Fixed */}
        <motion.aside
          initial={false}
          animate={{
            width: sidebarOpen ? 256 : 80
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed left-0 top-[80px] bottom-0 bg-blue-900 text-white p-5 z-40 overflow-hidden flex flex-col"
        >
          <nav className="flex flex-col gap-5 flex-1 overflow-y-auto">
            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/pre-onboarding")}
              className="flex items-center gap-3 hover:text-blue-300 transition-colors"
            >
              📝 <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Pre-Onboarding
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/trackonboarding")}
              className="flex items-center gap-3 hover:text-blue-300 transition-colors"
            >
              📊 <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Track Onboarding
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/employeedetails")}
              className="flex items-center gap-3 hover:text-blue-300 transition-colors"
            >
              👥 <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Employee Details
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/it-accounts")}
              className="flex items-center gap-3 hover:text-blue-300 transition-colors"
            >
              💻 <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    IT Accounts
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </nav>
          
          {/* Logout Button - Fixed at Bottom */}
          <div className="pt-5 border-t border-blue-800 mt-auto">
            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPasswordResetModal(true)}
              className="w-full flex items-center gap-3 hover:text-blue-300 transition-colors text-blue-400 hover:bg-blue-900/20 p-3 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium"
                  >
                    Change Password
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="w-full flex items-center gap-3 hover:text-red-300 transition-colors text-red-400 hover:bg-red-900/20 p-3 rounded-lg"
            >
              <FaSignOutAlt className="text-lg" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium"
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.aside>

        {/* Main - Scrollable content */}
        <main 
          className="p-8 space-y-8 min-h-[calc(100vh-80px)] transition-all duration-300 ease-in-out"
          style={{ marginLeft: sidebarOpen ? '256px' : '80px' }}
        >
          {/* Export Buttons and Email Account Management */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex gap-4 justify-end items-center flex-wrap"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEmailAccountManagement(!showEmailAccountManagement)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-purple-700 flex items-center gap-2 transition-colors"
            >
              📧 Email Account Management
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportEmployeesToExcel}
              className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <FaFileExcel /> Export Employee Data
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportStatisticsToExcel}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <FaDownload /> Export Statistics
            </motion.button>
          </motion.div>

          {/* Email Account Management - Expandable Container */}
          <AnimatePresence>
            {showEmailAccountManagement && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 overflow-hidden"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    📧 Email Account Management
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddEmailAccount}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FaUserPlus /> Add Email Account
                  </motion.button>
                </div>

                {defaultEmailAccount && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Default Email Account:</p>
                        <p className="text-lg font-semibold text-blue-900">{defaultEmailAccount.email}</p>
                        {defaultEmailAccount.display_name && (
                          <p className="text-sm text-gray-500">{defaultEmailAccount.display_name}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
                        DEFAULT
                      </span>
                    </div>
                  </div>
                )}

                {emailAccounts.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-2">All Email Accounts:</p>
                    {emailAccounts.map((account) => (
                      <motion.div
                        key={account.id}
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{account.email}</span>
                            {account.is_default === "yes" && (
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          {account.display_name && (
                            <p className="text-sm text-gray-500">{account.display_name}</p>
                          )}
                        </div>
                        {account.is_default !== "yes" && (
                          <button
                            onClick={() => handleSetDefaultEmail(account.id)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Set as Default
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">No email accounts configured</p>
                    <p className="text-sm">Add an email account to start sending onboarding emails</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stat Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5"
          >
            {[
              { label: "Total Employees", value: employeeStats.total, color: "bg-blue-100", icon: "👥" },
              { label: "Male Employees", value: employeeStats.males, color: "bg-green-100", icon: "♂️" },
              { label: "Female Employees", value: employeeStats.females, color: "bg-pink-100", icon: "♀️" },
              { label: "Completed Onboarding", value: employeeStats.completed, color: "bg-purple-100", icon: "✅" },
              { label: "Pending Onboarding", value: employeeStats.pending, color: "bg-yellow-100", icon: "⏳" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={cardVariants.hover}
                className={`rounded-xl shadow-md p-5 text-center font-medium ${stat.color} relative overflow-hidden`}
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <h3 className="text-sm font-semibold text-gray-700">{stat.label}</h3>
                <motion.p 
                  className="text-3xl font-bold mt-2 text-gray-800"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                >
                  {loading ? "..." : (stat.value || 0)}
                </motion.p>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Department Pie */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow-lg p-5 border border-gray-100"
            >
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-700">
                <FaChartPie className="text-blue-600" /> Department Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, "Employees"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ paddingTop: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Onboarding Progress */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow-lg p-5 border border-gray-100"
            >
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-700">
                <FaListAlt className="text-purple-600" /> Onboarding Progress
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={onboardingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                    cursor={{ fill: "rgba(37, 99, 235, 0.1)" }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    fill="#2563EB"
                    radius={[8, 8, 0, 0]}
                    name="Count"
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>

          {/* Recent Joiners */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.01 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Recent Joiners</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportEmployeesToExcel}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
              >
                <FaFileExcel /> Export
              </motion.button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Role</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Department</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                                         {recentJoinees.map((emp, index) => {
                       // Check if all tasks are completed
                       const tasks = emp.tasks || [];
                       const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.status === "completed");
                       const displayStatus = allTasksCompleted ? "completed" : (emp.status === "completed" ? "completed" : "pending");
                       return (
                         <motion.tr
                           key={emp.emp_id}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0 }}
                           transition={{ delay: index * 0.1 }}
                           className="border-t hover:bg-blue-50 transition-colors"
                         >
                           <td className="px-4 py-3 text-gray-700">{emp.name}</td>
                           <td className="px-4 py-3 text-gray-600 text-sm">{emp.email}</td>
                           <td className="px-4 py-3 text-gray-600">{emp.role}</td>
                           <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                           <td className="px-4 py-3">
                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                               displayStatus === "completed" 
                                 ? "bg-green-100 text-green-700" 
                                 : "bg-yellow-100 text-yellow-700"
                             }`}>
                               {displayStatus === "completed" ? "✅ Completed" : "⏳ Pending"}
                             </span>
                           </td>
                         </motion.tr>
                       );
                     })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Feedback */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 border border-purple-100"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Employee Feedback Summary</h3>
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="text-5xl"
              >
                ⭐
              </motion.div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? "..." : feedbackStats.avg} / 5
                </p>
                <p className="text-gray-600 text-sm mt-1">{feedbackStats.count} feedbacks collected</p>
              </div>
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(feedbackStats.avg / 5) * 100}%` }}
              transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
              className="mt-4 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
            />
          </motion.div>
        </main>
      </div>

      {/* Email Account Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">Add Email Account</h2>
              
              <form onSubmit={handleSubmitEmailAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={emailFormData.email}
                    onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="hr@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={emailFormData.password}
                    onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Email account password"
                  />
                  <p className="text-xs text-gray-500 mt-1">Password will be encrypted and stored securely</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={emailFormData.display_name}
                    onChange={(e) => setEmailFormData({ ...emailFormData, display_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="HR Team"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={emailFormData.notes}
                    onChange={(e) => setEmailFormData({ ...emailFormData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Any additional notes about this account..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Account
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showPasswordResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowPasswordResetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">Reset Password</h2>
              
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Old Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordResetData.old_password}
                    onChange={(e) => setPasswordResetData({ ...passwordResetData, old_password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordResetData.new_password}
                    onChange={(e) => setPasswordResetData({ ...passwordResetData, new_password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordResetData.confirm_password}
                    onChange={(e) => setPasswordResetData({ ...passwordResetData, confirm_password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  {passwordResetData.new_password && passwordResetData.confirm_password && 
                   passwordResetData.new_password !== passwordResetData.confirm_password && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowPasswordResetModal(false);
                      setPasswordResetData({ old_password: "", new_password: "", confirm_password: "" });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reset Password
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HrDashboard;
