import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaFilter, FaEye, FaChartLine } from "react-icons/fa";
import { motion } from "framer-motion";
import SumeruLogo from "../assets/sumeru-logo.png";
import { getApiUrl } from "../utils/apiConfig";

const TrackOnboarding = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const apiUrl = getApiUrl();

  const taskOrder = [
    "Personal Details",
    "Joining Day",
    "Training",
    "Department Introduction",
    "Feedback"
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, statusFilter, departmentFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/employees`);
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter (normalize: only completed or pending)
    // Check task completion first, then fall back to emp.status
    if (statusFilter !== "all") {
      filtered = filtered.filter((emp) => {
        const completion = calculateCompletion(emp.tasks || []);
        const currentStage = getCurrentStage(emp.tasks || []);
        const allTasksCompleted = completion === 100 && currentStage === "Completed";
        const normalizedStatus = allTasksCompleted ? "completed" : (emp.status === "completed" ? "completed" : "pending");
        if (statusFilter === "completed") return normalizedStatus === "completed";
        if (statusFilter === "pending") return normalizedStatus === "pending";
        return true;
      });
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (emp) => emp.department === departmentFilter
      );
    }

    setFilteredEmployees(filtered);
  };

  const calculateCompletion = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return Math.round((completed / tasks.length) * 100);
  };

  const getCurrentStage = (tasks) => {
    if (!tasks || tasks.length === 0) return "Not Started";
    
    // Find the first incomplete task
    for (const taskTitle of taskOrder) {
      const task = tasks.find((t) => t.title === taskTitle);
      if (!task || task.status !== "completed") {
        return taskTitle;
      }
    }
    return "Completed";
  };

  const getDepartments = () => {
    const depts = new Set(employees.map((emp) => emp.department).filter(Boolean));
    return Array.from(depts).sort();
  };

  // Helper function to check if employee has completed all tasks
  const hasCompletedAllTasks = (emp) => {
    const completion = calculateCompletion(emp.tasks || []);
    const currentStage = getCurrentStage(emp.tasks || []);
    return completion === 100 && currentStage === "Completed";
  };

  const stats = {
    total: employees.length,
    // Count employees who completed all tasks OR have status as completed
    completed: employees.filter((e) => hasCompletedAllTasks(e) || e.status === "completed").length,
    // Count all non-completed, non-disabled employees as pending
    pending: employees.filter((e) => !hasCompletedAllTasks(e) && e.status !== "completed" && e.status !== "disabled").length,
    avgCompletion: employees.length > 0
      ? Math.round(
          employees.reduce(
            (acc, emp) => acc + calculateCompletion(emp.tasks || []),
            0
          ) / employees.length
        )
      : 0,
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-6 py-4 flex justify-between items-center shadow-lg fixed top-0 left-0 right-0 z-50"
      >
        <div className="flex items-center gap-4">
          <img
            src={SumeruLogo}
            alt="Sumeru Logo"
            style={{ width: "200px" }}
            className="drop-shadow-md"
          />
        </div>
        <h2 className="text-lg font-semibold">Track Onboarding</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/hrdashboard")}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
          >
            ← Dashboard
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="pt-24 px-6 pb-8 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: "Total Employees", value: stats.total, color: "bg-blue-500", icon: "👥" },
            { label: "Completed", value: stats.completed, color: "bg-green-500", icon: "✅" },
            { label: "In Progress", value: stats.pending, color: "bg-yellow-500", icon: "⏳" },
            { label: "Avg Completion", value: `${stats.avgCompletion}%`, color: "bg-purple-500", icon: "📊" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.color} rounded-xl p-5 text-white shadow-lg transform hover:scale-105 transition-transform`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-5 mb-6 border border-gray-100"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Departments</option>
              {getDepartments().map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Employee Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading employees...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No employees found</p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Current Stage
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((emp, index) => {
                    const completion = calculateCompletion(emp.tasks || []);
                    const currentStage = getCurrentStage(emp.tasks || []);
                    // Check if all tasks are completed - if so, show as completed regardless of emp.status
                    const allTasksCompleted = completion === 100 && currentStage === "Completed";
                    const displayStatus = allTasksCompleted ? "completed" : (emp.status === "completed" ? "completed" : "pending");
                    return (
                      <motion.tr
                        key={emp.emp_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">
                              {emp.name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {emp.email || "N/A"}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {emp.role || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {emp.department || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700 font-medium">
                            {currentStage}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2.5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${completion}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className={`h-2.5 rounded-full ${
                                  completion === 100
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                    : completion >= 50
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                    : "bg-gradient-to-r from-yellow-500 to-orange-500"
                                }`}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
                              {completion}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              displayStatus === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {displayStatus === "completed" ? "✅ Completed" : "⏳ Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/employeedetails?id=${emp.emp_id}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 transition-colors"
                          >
                            <FaEye className="text-xs" />
                            View Details
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TrackOnboarding;
