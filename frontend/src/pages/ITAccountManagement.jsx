import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaEdit, FaPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";
import SumeruLogo from "../assets/sumeru-logo.png";
import { getApiUrl } from "../utils/apiConfig";

const ITAccountManagement = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    company_email: "",
    company_password: ""
  });
  const apiUrl = getApiUrl();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const hrToken = localStorage.getItem("token");
      if (!hrToken) {
        alert("Please login as HR first");
        navigate("/hr-login");
        return;
      }

      const [empRes, itRes] = await Promise.all([
        fetch(`${apiUrl}/employees`),
        fetch(`${apiUrl}/it-accounts/`, {
          headers: { Authorization: `Bearer ${hrToken}` }
        }).catch(() => ({ ok: false }))
      ]);

      const employeesData = await empRes.json();
      let itAccountsData = {};
      
      if (itRes.ok) {
        const accounts = await itRes.json();
        accounts.forEach(acc => {
          itAccountsData[acc.employee_id] = acc;
        });
      } else if (itRes.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/hr-login");
        return;
      }

      // Merge IT account data with employees
      // Note: Backend may already include it_accounts via joinedload, so check both
      const merged = employeesData.map(emp => ({
        ...emp,
        it_account: emp.it_accounts || itAccountsData[emp.emp_id] || null
      }));

      setEmployees(merged);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];
    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredEmployees(filtered);
  };

  const handleViewPassword = async (employeeId) => {
    try {
      const hrToken = localStorage.getItem("token");
      if (!hrToken) {
        alert("Please login as HR first");
        navigate("/hr-login");
        return;
      }

      const res = await fetch(`${apiUrl}/it-accounts/employee/${employeeId}/password`, {
        headers: { Authorization: `Bearer ${hrToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setPasswordData(data);
        const employee = employees.find(emp => emp.emp_id === employeeId);
        setSelectedEmployee(employee);
        setShowPasswordModal(true);
      } else {
        if (res.status === 401) {
          alert("Session expired. Please login again.");
          localStorage.removeItem("token");
          navigate("/hr-login");
        } else {
          const error = await res.json();
          alert(`Failed: ${error.detail || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Error fetching password:", error);
      alert("Failed to fetch password. Please try again.");
    }
  };

  const handleCreateAccount = (employee) => {
    setEditingAccount(null);
    setSelectedEmployee(employee);
    setFormData({
      company_email: "",
      company_password: ""
    });
    setShowFormModal(true);
  };

  const handleEditAccount = (employee) => {
    setEditingAccount(employee.it_account);
    setSelectedEmployee(employee);
    
    // Load existing data (without passwords)
    setFormData({
      company_email: employee.it_account?.company_email || "",
      company_password: ""  // Don't pre-fill password
    });
    setShowFormModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    
    try {
      const hrToken = localStorage.getItem("token");
      if (!hrToken) {
        alert("Please login as HR first");
        navigate("/hr-login");
        return;
      }

      const url = editingAccount 
        ? `${apiUrl}/it-accounts/employee/${selectedEmployee.emp_id}`
        : `${apiUrl}/it-accounts/`;
      
      const method = editingAccount ? "PUT" : "POST";
      
      const payload = editingAccount 
        ? { ...formData }  // Update only changed fields
        : { employee_id: selectedEmployee.emp_id, ...formData };  // Create needs employee_id

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hrToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(editingAccount ? "IT Account updated successfully!" : "IT Account created successfully!");
        setShowFormModal(false);
        fetchEmployees();
      } else {
        if (res.status === 401) {
          alert("Session expired. Please login again.");
          localStorage.removeItem("token");
          navigate("/hr-login");
        } else {
          const error = await res.json();
          alert(`Failed: ${error.detail || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Error saving IT account:", error);
      alert("Failed to save IT account. Please try again.");
    }
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
          <img src={SumeruLogo} alt="Sumeru Logo" style={{ width: "200px" }} className="drop-shadow-md" />
        </div>
        <h1 className="text-xl font-bold">IT Account Management</h1>
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
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-5 mb-6 border border-gray-100"
        >
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Employee List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Company Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((emp) => (
                    <motion.tr
                      key={emp.emp_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{emp.name}</div>
                          <div className="text-sm text-gray-500">{emp.email}</div>
                          <div className="text-xs text-gray-400">{emp.department}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {emp.it_account?.company_email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {emp.it_account ? (
                            <>
                              <button
                                onClick={() => handleViewPassword(emp.emp_id)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleEditAccount(emp)}
                                className="text-green-600 hover:text-green-800 font-medium text-sm"
                              >
                                <FaEdit />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleCreateAccount(emp)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                            >
                              <FaPlus /> Create Account
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-4">{selectedEmployee?.name}'s Credentials</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
                <input
                  type="text"
                  value={passwordData?.company_email || ""}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData?.company_password || ""}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 pr-10"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setShowPassword(false);
                setPasswordData(null);
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-4">
              {editingAccount ? "Edit" : "Create"} IT Account - {selectedEmployee?.name}
            </h2>
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
                <input
                  type="email"
                  value={formData.company_email}
                  onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Password</label>
                <input
                  type="password"
                  value={formData.company_password}
                  onChange={(e) => setFormData({ ...formData, company_password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {editingAccount ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ITAccountManagement;
