// src/pages/DepartmentIntro.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import SumeruLogo from "../assets/sumeru-logo.png";
import { completeModule } from "../utils/moduleProgress";
import { getApiUrl } from "../utils/apiConfig";

/**
 * DepartmentIntro.jsx
 * - Professional org chart with smooth elbow connectors (no curves)
 * - Responsive layout using TailwindCSS
 */

export default function DepartmentIntro() {
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [groupedTeam, setGroupedTeam] = useState({});
  const [loading, setLoading] = useState(true);
  const [messaged, setMessaged] = useState({});
  const [saved, setSaved] = useState(false);
  const [paths, setPaths] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const containerRef = useRef(null);
  const headRef = useRef(null);
  const roleRefs = useRef({});
  const memberRefs = useRef({});

  const navigate = useNavigate();
  const { token } = useParams();
  const location = useLocation();
  const API_URL = getApiUrl();

  /** Fetch Employee */
  useEffect(() => {
    async function fetchEmployee() {
      try {
        const res = await fetch(`${API_URL}/employees/by-token/${token}`);
        const data = await res.json();
        setCurrentEmployee(data);
      } catch (err) {
        console.error("Failed to fetch employee", err);
      }
    }
    fetchEmployee();
  }, [token]);

  /** Fetch Team */
  useEffect(() => {
    async function fetchTeam() {
      if (!currentEmployee) return;
      try {
        const res = await fetch(
          `${API_URL}/employees/department/${currentEmployee.department}/exclude/${token}`
        );
        const team = await res.json();
        const grouped = team.reduce((acc, emp) => {
          acc[emp.role] = acc[emp.role] || [];
          acc[emp.role].push(emp);
          return acc;
        }, {});
        setGroupedTeam(grouped);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch team", err);
        setGroupedTeam({});
        setLoading(false);
      }
    }
    fetchTeam();
  }, [currentEmployee, token]);

  /** Compute connector paths with proper tree structure */
  useEffect(() => {
    function computePaths() {
      const container = containerRef.current;
      const headEl = headRef.current;
      if (!container || !headEl) return setPaths([]);

      const cRect = container.getBoundingClientRect();
      const px = (x) => x - cRect.left;
      const py = (y) => y - cRect.top;

      const newPaths = [];

      const headRect = headEl.getBoundingClientRect();
      const headCenterX = px(headRect.left + headRect.width / 2);
      const headBottomY = py(headRect.bottom);

      // Collect all role positions
      const rolePositions = [];
      Object.keys(groupedTeam).forEach((role) => {
        const rRef = roleRefs.current[role];
        if (!rRef?.current) return;
        const rRect = rRef.current.getBoundingClientRect();
        rolePositions.push({
          role,
          topY: py(rRect.top),
          centerX: px(rRect.left + rRect.width / 2),
          bottomY: py(rRect.bottom),
        });
      });

      if (rolePositions.length === 0) return setPaths([]);

      // Calculate horizontal branch level (between head and roles)
      const minRoleTop = Math.min(...rolePositions.map(r => r.topY));
      const branchLevelY = headBottomY + (minRoleTop - headBottomY) * 0.5; // 50% down

      // Find leftmost and rightmost role positions for horizontal branch
      const sortedRoles = rolePositions.sort((a, b) => a.centerX - b.centerX);
      const leftmostX = sortedRoles[0].centerX;
      const rightmostX = sortedRoles[sortedRoles.length - 1].centerX;

      // Draw main trunk: Head → Branch Level
      newPaths.push({
        d: `M ${headCenterX},${headBottomY} L ${headCenterX},${branchLevelY}`,
        stroke: "#3B82F6",
        strokeWidth: "3",
      });

      // Draw horizontal branch connecting all roles
      newPaths.push({
        d: `M ${leftmostX},${branchLevelY} L ${rightmostX},${branchLevelY}`,
        stroke: "#3B82F6",
        strokeWidth: "3",
      });

      // Draw connections from branch to each role, then to members
      rolePositions.forEach(({ role, topY, centerX, bottomY }) => {
        // Branch → Role (vertical line down)
        newPaths.push({
          d: `M ${centerX},${branchLevelY} L ${centerX},${topY}`,
          stroke: "#60A5FA",
          strokeWidth: "2",
        });

        // Role → Members (linked list style - one to one connection)
        const members = groupedTeam[role] || [];
        members.forEach((m, index) => {
          const memberId = m.emp_id || m.id; // Support both formats
          const mRef = memberRefs.current[memberId];
          if (!mRef?.current) return;
          const mRect = mRef.current.getBoundingClientRect();
          const memberCenterX = px(mRect.left + mRect.width / 2);
          const memberTopY = py(mRect.top);
          const memberBottomY = py(mRect.bottom);
          
          if (index === 0) {
            // First member: Connect from role bottom to first member top
            newPaths.push({
              d: `M ${centerX},${bottomY} L ${centerX},${memberTopY} L ${memberCenterX},${memberTopY}`,
              stroke: "#93C5FD",
              strokeWidth: "2",
            });
          } else {
            // Subsequent members: Connect from previous member bottom to current member top
            const prevMember = members[index - 1];
            const prevMemberId = prevMember.emp_id || prevMember.id;
            const prevMRef = memberRefs.current[prevMemberId];
            if (prevMRef?.current) {
              const prevMRect = prevMRef.current.getBoundingClientRect();
              const prevMemberCenterX = px(prevMRect.left + prevMRect.width / 2);
              const prevMemberBottomY = py(prevMRect.bottom);
              
              // Connect previous member bottom to current member top (linked list style)
              newPaths.push({
                d: `M ${prevMemberCenterX},${prevMemberBottomY} L ${prevMemberCenterX},${memberTopY} L ${memberCenterX},${memberTopY}`,
                stroke: "#93C5FD",
                strokeWidth: "2",
              });
            }
          }
        });
      });

      setPaths(newPaths);
    }

    const t = setTimeout(computePaths, 200);
    window.addEventListener("resize", computePaths);
    window.addEventListener("scroll", computePaths);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", computePaths);
      window.removeEventListener("scroll", computePaths);
    };
  }, [groupedTeam, currentEmployee]);

  /** Handlers */
  const handleViewDetails = async (member) => {
    setSelectedMember(member);
    setLoadingDetails(true);
    setActiveTab("overview");
    
    try {
      // Fetch detailed employee information
      const memberId = member.emp_id || member.id;
      const detailsRes = await fetch(`${API_URL}/employees/${memberId}/personal-info`);
      const personalInfo = detailsRes.ok ? await detailsRes.json() : null;
      
      // Fetch IT account (company email) if available
      let itAccount = null;
      try {
        const itRes = await fetch(`${API_URL}/it-accounts/employee/${memberId}`);
        if (itRes.ok) {
          itAccount = await itRes.json();
        }
      } catch (e) {
        // IT account might not exist, that's okay
      }
      
      setMemberDetails({
        ...member,
        personalInfo,
        itAccount,
      });
    } catch (err) {
      console.error("Failed to fetch member details:", err);
      setMemberDetails(member);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedMember(null);
    setMemberDetails(null);
    setActiveTab("overview");
  };

  const handleSendEmail = (email) => {
    const subject = encodeURIComponent(`Hello from ${currentEmployee?.name || "New Team Member"}`);
    const body = encodeURIComponent(
      `Hi,\n\n` +
      `I'm ${currentEmployee?.name || "a new team member"} and I'm reaching out to introduce myself.\n\n` +
      `Looking forward to working with you!\n\n` +
      `Best regards,\n${currentEmployee?.name || ""}`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    
    // Mark as contacted
    if (selectedMember) {
      const memberId = selectedMember.emp_id || selectedMember.id;
      setMessaged((p) => ({ ...p, [memberId]: true }));
      if (token) {
        completeModule(token, "Department Introduction", "team_contact");
      }
    }
  };

  const handleCopyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      alert("Email copied to clipboard!");
    } catch (err) {
      alert("Failed to copy email. Email: " + email);
    }
  };

  const handleCall = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  // Track org_chart module when page loads (user views org chart)
  useEffect(() => {
    if (token && !loading && currentEmployee) {
      completeModule(token, "Department Introduction", "org_chart");
    }
  }, [token, loading, currentEmployee]);

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, task: "Department Introduction" }),
      });
      if (res.ok) {
        setSaved(true);
        alert("✅ Progress saved");
      } else alert("❌ Failed to save progress");
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrevious = () => navigate(`/training/${token}`);
  const handleNext = () => {
    if (saved)
      navigate(`/feedback/${token}`, {
        state: { ...location.state, messaged: Object.keys(messaged) },
      });
  };

  /** Render */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D0DEEB] text-blue-800">
        Loading department hierarchy…
      </div>
    );

  const department = (currentEmployee?.department || "HR").toUpperCase();

  return (
    <div className="min-h-screen bg-[#D0DEEB] text-gray-800">
      {/* Header */}
      <div className="bg-blue-950 text-white px-10 py-6 flex flex-col lg:flex-row items-center lg:justify-between shadow-md fixed top-0 left-0 w-full z-50">
        <div className="flex items-center space-x-3">
          <img src={SumeruLogo} alt="Logo" className="w-[280px]" />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
          <h1 className="text-2xl font-bold">🏢 Department Introduction</h1>
          <p className="text-blue-200 font-medium text-sm mt-1">
            Meet your {department} team
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/dashboard/${token}`)}
            className="bg-white text-blue-800 px-4 py-2 rounded hover:bg-gray-100 transition"
          >
            Home
          </button>
        </div>
      </div>

      {/* Org Chart */}
      <div ref={containerRef} className="relative max-w-7xl mx-auto px-6 pt-36 pb-24">
        {/* SVG Connectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          {paths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              stroke={p.stroke}
              strokeWidth={p.strokeWidth || "2"}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>

        {/* Head of Department */}
        <div className="flex justify-center mb-10">
          <div
            ref={headRef}
            className="bg-white rounded-xl shadow-lg border border-blue-200 px-8 py-6 text-center w-80"
          >
            <div className="text-xs text-blue-500 font-semibold">DEPARTMENT</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{department}</div>
            <div className="mt-3">
              <div className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {currentEmployee?.name
                    ?.split(" ")
                    .map((s) => s[0])
                    .join("")
                    .toUpperCase() || "HD"}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{currentEmployee?.name || "Head"}</div>
                  <div className="text-sm text-gray-500">{currentEmployee?.role || "Head of Dept"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles + Members */}
        <div className="flex flex-wrap justify-center gap-12 relative z-10">
          {Object.entries(groupedTeam).map(([role, members]) => {
            if (!roleRefs.current[role]) roleRefs.current[role] = React.createRef();
            return (
              <div key={role} className="flex flex-col items-center gap-6">
                {/* Role Card */}
                <div
                  ref={roleRefs.current[role]}
                  className="bg-white rounded-xl shadow-md border border-blue-100 px-6 py-4 text-center min-w-[220px] relative z-10"
                >
                  <div className="text-sm text-blue-700 font-semibold">{role}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {members.length} member{members.length > 1 ? "s" : ""}
                  </div>
                </div>

                {/* Members */}
                <div className="flex flex-col items-center gap-5">
                  {members.map((m) => {
                    const memberId = m.emp_id || m.id; // Support both formats
                    if (!memberRefs.current[memberId]) memberRefs.current[memberId] = React.createRef();
                    const initials = m.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase();
                    return (
                      <div
                        key={memberId}
                        ref={memberRefs.current[memberId]}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 w-56 p-4 text-center hover:shadow-md transition relative z-10"
                      >
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                          {initials}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{m.name}</div>
                        <div className="text-xs text-gray-500">{m.role}</div>
                        <div className="text-xs text-gray-400 truncate mt-1 mb-2">{m.email}</div>
                        
                        {/* View Details Button */}
                        <button
                          onClick={() => handleViewDetails(m)}
                          className="mt-2 w-full px-3 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                          👤 View Details
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center mt-14 gap-6 flex-wrap">
          <button
            onClick={handlePrevious}
            className="px-8 py-3 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            ← Previous
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Progress
          </button>
          <button
            onClick={handleNext}
            disabled={!saved}
            className={`px-8 py-3 rounded text-white ${
              saved ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Employee Details Modal */}
      {selectedMember && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 relative">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition"
              >
                ✕
              </button>
              
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {(selectedMember.name || "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{selectedMember.name}</h2>
                  <p className="text-blue-100">{selectedMember.role} • {selectedMember.department}</p>
                </div>
                <div className="flex gap-2">
                  {memberDetails?.personalInfo?.mobile && (
                    <button
                      onClick={() => handleCall(memberDetails.personalInfo.mobile)}
                      className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition"
                      title="Call"
                    >
                      📞 Call
                    </button>
                  )}
                  <button
                    onClick={() => handleSendEmail(selectedMember.email)}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    title="Send Email"
                  >
                    ✉️ Email
                  </button>
                  <button
                    onClick={() => handleCopyEmail(selectedMember.email)}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    title="Copy Email"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 flex gap-1 px-6 bg-gray-50">
              {["overview", "contact", "organisation"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading details...</span>
                </div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* Availability Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Availability</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex items-center gap-2 text-gray-700">
                            <span className="text-gray-400">•</span>
                            <span>Status: {memberDetails?.status === "completed" ? "Active" : memberDetails?.status || "Active"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <span>🕐</span>
                            <span>Work hours: Standard business hours</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                            <span className="text-xl">✉️</span>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500">Email</div>
                              <a href={`mailto:${selectedMember.email}`} className="text-blue-600 hover:underline">
                                {selectedMember.email}
                              </a>
                            </div>
                          </div>
                          
                          {memberDetails?.itAccount?.company_email && (
                            <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                              <span className="text-xl">📧</span>
                              <div className="flex-1">
                                <div className="text-xs text-gray-500">Company Email</div>
                                <a href={`mailto:${memberDetails.itAccount.company_email}`} className="text-blue-600 hover:underline">
                                  {memberDetails.itAccount.company_email}
                                </a>
                              </div>
                            </div>
                          )}

                          {memberDetails?.personalInfo?.mobile && (
                            <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                              <span className="text-xl">📱</span>
                              <div className="flex-1">
                                <div className="text-xs text-gray-500">Mobile</div>
                                <a href={`tel:${memberDetails.personalInfo.mobile}`} className="text-blue-600 hover:underline">
                                  {memberDetails.personalInfo.mobile}
                                </a>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                            <span className="text-xl">🏢</span>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500">Department</div>
                              <div className="text-gray-900">{selectedMember.department}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                            <span className="text-xl">💼</span>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500">Job Title</div>
                              <div className="text-gray-900">{selectedMember.role}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Tab */}
                  {activeTab === "contact" && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-xs text-gray-500 mb-1">Email Address</div>
                          <div className="text-gray-900 font-medium">{selectedMember.email}</div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSendEmail(selectedMember.email)}
                              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Send Email
                            </button>
                            <button
                              onClick={() => handleCopyEmail(selectedMember.email)}
                              className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        {memberDetails?.itAccount?.company_email && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-xs text-gray-500 mb-1">Company Email</div>
                            <div className="text-gray-900 font-medium">{memberDetails.itAccount.company_email}</div>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSendEmail(memberDetails.itAccount.company_email)}
                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Send Email
                              </button>
                              <button
                                onClick={() => handleCopyEmail(memberDetails.itAccount.company_email)}
                                className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        )}

                        {memberDetails?.personalInfo?.mobile && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-xs text-gray-500 mb-1">Mobile Number</div>
                            <div className="text-gray-900 font-medium">{memberDetails.personalInfo.mobile}</div>
                            <button
                              onClick={() => handleCall(memberDetails.personalInfo.mobile)}
                              className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 mt-2"
                            >
                              📞 Call
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Organisation Tab */}
                  {activeTab === "organisation" && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Organisation</h3>
                      
                      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Department</div>
                          <div className="text-lg font-semibold text-gray-900">{selectedMember.department}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Role</div>
                          <div className="text-lg font-semibold text-gray-900">{selectedMember.role}</div>
                        </div>

                        {memberDetails?.personalInfo?.dob && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Date of Birth</div>
                            <div className="text-gray-900">{memberDetails.personalInfo.dob}</div>
                          </div>
                        )}

                        {memberDetails?.personalInfo?.gender && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Gender</div>
                            <div className="text-gray-900">{memberDetails.personalInfo.gender}</div>
                          </div>
                        )}
                      </div>

                      {/* Team Members in Same Role */}
                      {groupedTeam[selectedMember.role] && groupedTeam[selectedMember.role].length > 1 && (
                        <div className="mt-6">
                          <h4 className="text-md font-semibold text-gray-900 mb-3">
                            {selectedMember.name} works with:
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {groupedTeam[selectedMember.role]
                              .filter((m) => (m.emp_id || m.id) !== (selectedMember.emp_id || selectedMember.id))
                              .map((colleague) => {
                                const colleagueId = colleague.emp_id || colleague.id;
                                const colleagueInitials = (colleague.name || "")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase();
                                return (
                                  <div
                                    key={colleagueId}
                                    className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:shadow-md transition cursor-pointer"
                                    onClick={() => handleViewDetails(colleague)}
                                  >
                                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                                      {colleagueInitials}
                                    </div>
                                    <div className="text-xs font-semibold text-gray-900 truncate">{colleague.name}</div>
                                    <div className="text-xs text-gray-500 truncate">{colleague.role}</div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
