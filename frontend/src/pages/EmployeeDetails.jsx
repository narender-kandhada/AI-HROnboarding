import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaDownload, FaUserCircle, FaEnvelope, FaPhone, FaIdCard, FaFilePdf, FaEye, FaPrint, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import SumeruLogo from "../assets/sumeru-logo.png";
import { getApiUrl } from "../utils/apiConfig";

const EmployeeDetails = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeFiles, setEmployeeFiles] = useState({}); // {employeeId: [files]}
  const [loadingFiles, setLoadingFiles] = useState({}); // {employeeId: true/false}
  const [showFilesModal, setShowFilesModal] = useState(null); // {employeeId, files}
  const apiUrl = getApiUrl();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, selectedDepartment, selectedRole, searchTerm]);

  // Fetch files for employees when needed
  const fetchEmployeeFiles = async (employeeId) => {
    // If already fetched, return cached files
    if (employeeFiles[employeeId]) {
      return employeeFiles[employeeId];
    }
    
    setLoadingFiles(prev => ({ ...prev, [employeeId]: true }));
    try {
      const response = await fetch(`${apiUrl}/documents/employee/${employeeId}/files`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const files = data.files || [];
        setEmployeeFiles(prev => ({ ...prev, [employeeId]: files }));
        return files;
      } else {
        if (response.status === 401) {
          alert("Authentication required. Please login again.");
          navigate("/hr-login");
        } else {
          console.error("Failed to fetch files:", response.status);
        }
        return [];
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      return [];
    } finally {
      setLoadingFiles(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const handleViewDocument = async (employeeId, filename) => {
    try {
      const response = await fetch(`${apiUrl}/documents/employee/${employeeId}/file/${filename}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          alert("Authentication required. Please login again.");
          navigate("/hr-login");
          return;
        }
        throw new Error(`Failed to fetch document: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      
      // Clean up the blob URL after a delay to free memory
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("Error viewing document:", error);
      alert(`Failed to view document: ${error.message}`);
    }
  };

  const handlePrintDocument = async (employeeId, filename) => {
    try {
      const response = await fetch(`${apiUrl}/documents/employee/${employeeId}/file/${filename}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          alert("Authentication required. Please login again.");
          navigate("/hr-login");
          return;
        }
        throw new Error(`Failed to fetch document: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Clean up the blob URL after printing
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        };
      } else {
        alert("Please allow pop-ups to print documents");
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error("Error printing document:", error);
      alert(`Failed to print document: ${error.message}`);
    }
  };

  const handleDownloadDocument = async (employeeId, filename) => {
    try {
      const response = await fetch(`${apiUrl}/documents/employee/${employeeId}/file/${filename}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          alert("Authentication required. Please login again.");
          navigate("/hr-login");
          return;
        }
        throw new Error(`Failed to fetch document: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert(`Failed to download document: ${error.message}`);
    }
  };

  const toggleEmployeeStatus = async (employeeId, currentStatus) => {
    const newStatus = currentStatus === "disabled" ? "active" : "disabled";
    
    try {
      const response = await fetch(`${apiUrl}/employees/${employeeId}/status?status=${newStatus}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        // Update local state
        setEmployees(prev => prev.map(emp => 
          emp.emp_id === employeeId ? { ...emp, status: newStatus } : emp
        ));
        alert(`Employee status updated to ${newStatus}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || "Failed to update status"}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update employee status");
    }
  };

  const exportEmployeeDetailsToExcel = () => {
    const wsData = filteredEmployees.map(emp => {
      const data = formatEmployeeData(emp);
      return {
        "Emp ID": data.empId,
        "Name": data.name,
        "Department": data.department,
        "Role": data.role,
        "DOB": data.dob,
        "Gender": data.gender,
        "Mobile": data.mobile,
        "Email": data.email,
        "Company Email": data.company_email,
        "Family 1 Name": data.family1_name,
        "Family 1 Relation": data.family1_relation,
        "Family 1 Mobile": data.family1_mobile,
        "Family 2 Name": data.family2_name,
        "Family 2 Relation": data.family2_relation,
        "Family 2 Mobile": data.family2_mobile,
        "Aadhaar": data.aadhaar_number,
        "PAN": data.pan_number,
        "Bank Account": data.bank_number,
        "IFSC Code": data.ifsc_code,
        "Status": getDisplayStatus(emp)
      };
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employee Details");
    
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `employee_details_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

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

    // Department filter (normalized comparison)
    if (selectedDepartment) {
      filtered = filtered.filter((emp) => {
        if (!emp.department) return false;
        return normalizeDepartment(emp.department) === normalizeDepartment(selectedDepartment);
      });
    }

    // Role filter
    if (selectedRole) {
      filtered = filtered.filter((emp) => emp.role === selectedRole);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((emp) => {
        const personalInfo = emp.personal_info || {};
        const itAccount = emp.it_accounts || null;
        return (
          emp.emp_id?.toLowerCase().includes(term) ||
          emp.name?.toLowerCase().includes(term) ||
          emp.email?.toLowerCase().includes(term) ||
          (itAccount?.company_email && itAccount.company_email.toLowerCase().includes(term)) ||
          emp.role?.toLowerCase().includes(term) ||
          emp.department?.toLowerCase().includes(term) ||
          personalInfo.mobile?.includes(term) ||
          personalInfo.aadhaar_number?.includes(term) ||
          personalInfo.pan_number?.toLowerCase().includes(term)
        );
      });
    }

    setFilteredEmployees(filtered);
  };

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

  const getDepartments = () => {
    // Normalize departments to avoid duplicates (HR vs hr, Design vs design, etc.)
    const deptMap = new Map();
    employees.forEach((emp) => {
      if (emp.department) {
        const normalized = normalizeDepartment(emp.department);
        if (!deptMap.has(normalized)) {
          // Keep the first occurrence's original format for display
          deptMap.set(normalized, emp.department);
        }
      }
    });
    return Array.from(deptMap.values()).sort();
  };

  const getRoles = () => {
    const roles = new Set(employees.map((emp) => emp.role).filter(Boolean));
    return Array.from(roles).sort();
  };

  // Helper function to check if employee has completed all tasks
  const hasCompletedAllTasks = (emp) => {
    const tasks = emp.tasks || [];
    return tasks.length > 0 && tasks.every(t => t.status === "completed");
  };

  // Helper function to get display status (check tasks first, then fall back to emp.status)
  const getDisplayStatus = (emp) => {
    if (hasCompletedAllTasks(emp)) {
      return "completed";
    }
    return emp.status === "completed" ? "completed" : "pending";
  };

  const formatEmployeeData = (emp) => {
    const personalInfo = emp.personal_info || {};
    const itAccount = emp.it_accounts || null;
    return {
      empId: emp.emp_id || "N/A",
      id: emp.emp_id,
      name: emp.name || "N/A",
      department: emp.department || "N/A",
      role: emp.role || "N/A",
      dob: personalInfo.dob || "N/A",
      gender: personalInfo.gender || "N/A",
      mobile: personalInfo.mobile || "N/A",
      email: emp.email || personalInfo.email || "N/A",
      company_email: itAccount?.company_email || "N/A",
      family1_name: personalInfo.family1_name || "N/A",
      family1_relation: personalInfo.family1_relation || "N/A",
      family1_mobile: personalInfo.family1_mobile || "N/A",
      family2_name: personalInfo.family2_name || "N/A",
      family2_relation: personalInfo.family2_relation || "N/A",
      family2_mobile: personalInfo.family2_mobile || "N/A",
      aadhaar_number: personalInfo.aadhaar_number || "N/A",
      pan_number: personalInfo.pan_number || "N/A",
      bank_number: personalInfo.bank_number || "N/A",
      ifsc_code: personalInfo.ifsc_code || "N/A",
      status: emp.status || "pending",
    };
  };

  const columns = [
    { key: "empId", label: "Emp ID", width: "w-28", sticky: true, left: 0 },
    { key: "name", label: "Name", width: "w-48", sticky: true, left: 112 },
    { key: "department", label: "Department", width: "w-32" },
    { key: "role", label: "Role", width: "w-40" },
    { key: "dob", label: "DOB", width: "w-28" },
    { key: "gender", label: "Gender", width: "w-24" },
    { key: "mobile", label: "Mobile", width: "w-32" },
    { key: "email", label: "Email", width: "w-56" },
    { key: "company_email", label: "Company Mail", width: "w-56" },
    { key: "family1_name", label: "Family 1 Name", width: "w-32" },
    { key: "family1_relation", label: "Relation", width: "w-28" },
    { key: "family1_mobile", label: "Family 1 Mobile", width: "w-32" },
    { key: "family2_name", label: "Family 2 Name", width: "w-32" },
    { key: "family2_relation", label: "Relation", width: "w-28" },
    { key: "family2_mobile", label: "Family 2 Mobile", width: "w-32" },
    { key: "aadhaar_number", label: "Aadhaar", width: "w-36" },
    { key: "pan_number", label: "PAN", width: "w-32" },
    { key: "bank_number", label: "Bank Account", width: "w-36" },
    { key: "ifsc_code", label: "IFSC Code", width: "w-28" },
    { key: "status", label: "Status", width: "w-28" },
    { key: "files", label: "Files", width: "w-32", action: true },
    { key: "employee_status", label: "Employee Status", width: "w-36", action: true },
  ];

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
        <h2 className="text-lg font-semibold">Employee Details</h2>
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
      <div className="pt-24 px-6 pb-8 max-w-[98%] mx-auto">
        {/* Stats and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-5 mb-6 border border-gray-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, company mail, mobile, Aadhaar, PAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedRole("");
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Departments</option>
              {getDepartments().map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Roles</option>
              {getRoles().map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <FaUserCircle className="text-blue-600" />
                <span className="text-sm text-gray-600">
                  Total: <span className="font-semibold text-gray-900">{employees.length}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaIdCard className="text-green-600" />
                <span className="text-sm text-gray-600">
                  Showing: <span className="font-semibold text-gray-900">{filteredEmployees.length}</span>
                </span>
              </div>
            </div>
            {filteredEmployees.length > 0 && (
              <button
                onClick={exportEmployeeDetailsToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaDownload />
                Export
              </button>
            )}
          </div>
        </motion.div>

        {/* Table Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading employee data...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <FaUserCircle className="mx-auto text-gray-300 text-5xl mb-4" />
              <p className="text-gray-500 text-lg">No employees found</p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your filters or search term
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-4 py-4 text-left font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 ${
                          col.sticky
                            ? `sticky ${col.left === 0 ? "left-0" : "left-28"} z-30 bg-gradient-to-r from-blue-50 via-blue-50 to-purple-50`
                            : ""
                        }`}
                        style={col.sticky ? { left: `${col.left}px`, boxShadow: col.left === 0 ? "2px 0 4px rgba(0,0,0,0.1)" : "2px 0 4px rgba(0,0,0,0.1)" } : {}}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((emp, index) => {
                    const data = formatEmployeeData(emp);
                    return (
                      <motion.tr
                        key={emp.emp_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="group hover:bg-blue-50/50 transition-colors"
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-4 py-3 whitespace-nowrap text-gray-700 ${
                              col.sticky
                                ? `sticky ${col.left === 0 ? "left-0" : "left-28"} z-10 bg-white group-hover:bg-blue-50/50`
                                : ""
                            } ${col.key === "status" ? "font-medium" : ""}`}
                            style={col.sticky ? { left: `${col.left}px`, boxShadow: col.left === 0 ? "2px 0 4px rgba(0,0,0,0.05)" : "2px 0 4px rgba(0,0,0,0.05)" } : {}}
                          >
                            {col.key === "files" ? (
                              <button
                                onClick={async () => {
                                  const files = await fetchEmployeeFiles(emp.emp_id);
                                  setShowFilesModal({ employeeId: emp.emp_id, files: files || [] });
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm"
                              >
                                <FaFilePdf className="text-xs" />
                                <span>View Files</span>
                                {loadingFiles[emp.emp_id] && (
                                  <span className="ml-1 text-xs">...</span>
                                )}
                              </button>
                            ) : col.key === "employee_status" ? (
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${emp.status === "disabled" ? "text-red-600" : "text-green-600"}`}>
                                  {emp.status === "disabled" ? "Disabled" : "Active"}
                                </span>
                                <button
                                  onClick={() => toggleEmployeeStatus(emp.emp_id, emp.status || "pending")}
                                  className="text-2xl transition-colors"
                                  title={emp.status === "disabled" ? "Click to enable" : "Click to disable"}
                                >
                                  {emp.status === "disabled" ? (
                                    <FaToggleOff className="text-red-500 hover:text-red-700" />
                                  ) : (
                                    <FaToggleOn className="text-green-500 hover:text-green-700" />
                                  )}
                                </button>
                              </div>
                            ) : col.key === "status" ? (
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  getDisplayStatus(emp) === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {getDisplayStatus(emp) === "completed" ? "✅ Completed" : "⏳ Pending"}
                              </span>
                            ) : col.key === "email" || col.key === "company_email" ? (
                              <div className="flex items-center gap-2">
                                <FaEnvelope className="text-gray-400 text-xs" />
                                <span className="truncate max-w-[200px]" title={data[col.key]}>
                                  {data[col.key]}
                                </span>
                              </div>
                            ) : col.key === "mobile" || col.key.includes("mobile") ? (
                              <div className="flex items-center gap-2">
                                <FaPhone className="text-gray-400 text-xs" />
                                {data[col.key]}
                              </div>
                            ) : (
                              <span className={data[col.key] === "N/A" ? "text-gray-400 italic" : ""}>
                                {data[col.key]}
                              </span>
                            )}
                          </td>
                        ))}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Files Modal */}
      {showFilesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Employee Documents</h3>
              <button
                onClick={() => setShowFilesModal(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {loadingFiles[showFilesModal.employeeId] ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading files...</p>
                </div>
              ) : showFilesModal.files.length === 0 ? (
                <div className="text-center py-8">
                  <FaFilePdf className="mx-auto text-gray-300 text-4xl mb-4" />
                  <p className="text-gray-500">No documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {showFilesModal.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FaFilePdf className="text-red-600 text-xl" />
                        <div>
                          <p className="font-medium text-gray-800">{file.display_name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB • {file.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDocument(showFilesModal.employeeId, file.filename)}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                          title="View Document"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(showFilesModal.employeeId, file.filename)}
                          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                          title="Download Document"
                        >
                          <FaDownload />
                        </button>
                        <button
                          onClick={() => handlePrintDocument(showFilesModal.employeeId, file.filename)}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                          title="Print Document"
                        >
                          <FaPrint />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetails;
