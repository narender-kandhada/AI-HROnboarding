import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SumeruLogo from "../assets/sumeru-logo.png";
import { getEmployeeModuleProgress } from "../utils/moduleProgress";
import { getApiUrl } from "../utils/apiConfig";

export default function Dashboard() {
  const navigate = useNavigate();
  const { token } = useParams();
  const API_URL = getApiUrl();

  const [employee, setEmployee] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/employees/by-token/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => setEmployee(data))
      .catch((err) => {
        console.error("❌ Failed to fetch employee:", err);
        navigate("/hr-login");
      });
  }, [token, API_URL]);

  useEffect(() => {
    if (!employee?.emp_id) return;
    fetch(`${API_URL}/employees/${employee.emp_id}/completed-tasks`)
      .then((res) => res.json())
      .then((data) => setCompletedTasks(data.tasks || []))
      .catch((err) => console.error("❌ Failed to fetch completed tasks:", err));
  }, [employee, API_URL]);

  const routeTemplates = {
    personalDetails: "/personal-details/:token",
    joiningDay: "/joining-day/:token",
    training: "/training/:token",
    departmentIntro: "/department-intro/:token",
    feedback: "/feedback/:token",
    preReview: "/pre-review/:token",
  };

  const tasks = [
    { title: "Personal Details", icon: "👤", routeKey: "personalDetails" },
    { title: "Joining Day", icon: "🎉", routeKey: "joiningDay" },
    { title: "Training", icon: "📚", routeKey: "training" },
    { title: "Department Introduction", icon: "🏢", routeKey: "departmentIntro" },
    { title: "Feedback", icon: "💬", routeKey: "feedback" },
    { title: "Final Review", icon: "📋", routeKey: "preReview", isReview: true },
  ];

  const getStatus = (title) =>
    completedTasks.includes(title) ? "Completed" : "Pending";

  const handleCardClick = (routeKey) => {
    let route = routeTemplates[routeKey];
    if (route.includes(":token")) {
      const resolvedToken = token || "default-token";
      route = route.replace(":token", resolvedToken);
    }
    navigate(route);
  };

  // Calculate completion rate excluding review task
  const regularTasks = tasks.filter(task => !task.isReview);
  const completionRate = Math.round(
    (completedTasks.length / regularTasks.length) * 100
  );
  
  // Check if all regular tasks are completed (review should only be enabled when all others are done)
  const allTasksCompleted = completedTasks.length === regularTasks.length;

  return (
    <div className="min-h-screen w-full bg-[#D0DEEB] text-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-12 pt-32">

        {/* ==== TOP HEADER BAR ==== */}
        <div className="bg-blue-950 text-white px-10 py-6 flex flex-col lg:flex-row items-center lg:justify-between shadow-md fixed top-0 left-0 w-full z-50">
          {/* Left: Logo */}
          <div className="flex items-center space-x-3">
            <img
              src={SumeruLogo}
              alt="Sumeru Logo"
              style={{ width: "300px" }}
              className="drop-shadow-md"
            />
          </div>
          {/* Right side: HR Login */}
            <div className="flex items-center gap-4">
              <span className="text-sm">Welcome, HR</span>
              <button
                className="bg-white text-blue-800 px-4 py-2 rounded hover:bg-gray-100 transition"
                onClick={() => navigate("/hr-login")}
              >
                HR Login
              </button>
            </div>
          {/* Center: Welcome Text */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            <h1 className="text-2xl font-bold">
              Welcome to Sumeru Digital Solutions:
              <span className="text-blue-300">
                {" "}
                {employee?.name ?? "Employee"} 👋
              </span>
            </h1>
            <p className="text-blue-200 font-medium text-sm tracking-wide mt-1">
              DELIVER | SUPPORT | GROW
            </p>
          </div>
        </div>

        {/* ==== BODY SECTION ==== */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Progress */}
          <div className="w-full max-w-3xl mx-auto mb-10">
            <div className="flex justify-between text-sm font-semibold text-blue-900 mb-2">
              <span>Progress</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-4 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-700 h-4 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>

          {/* View Mode Button */}
          <div className="flex justify-end mb-8">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow transition"
              onClick={() =>
                setViewMode(viewMode === "cards" ? "timeline" : "cards")
              }
            >
              Switch to {viewMode === "cards" ? "Timeline" : "Card"} View
            </button>
          </div>

          {/* Cards Section */}
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task, i) => {
                const status = getStatus(task.title);
                const completed = status === "Completed";
                const isReview = task.isReview;
                const isDisabled = isReview && !allTasksCompleted;

                return (
                  <div
                    key={i}
                    className={`p-6 rounded-2xl shadow-md border transition transform ${
                      isDisabled 
                        ? "opacity-50 cursor-not-allowed" 
                        : "hover:scale-105 hover:shadow-lg"
                    } ${
                      completed
                        ? "bg-blue-50 border-blue-300"
                        : isReview
                        ? "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-300"
                        : "bg-white border-blue-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold flex items-center space-x-2 text-blue-900">
                        <span className="text-2xl">{task.icon}</span>
                        <span>{task.title}</span>
                      </h2>
                      {!isReview && (
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            completed
                              ? "bg-green-500 text-white"
                              : "bg-yellow-400 text-gray-900"
                          }`}
                        >
                          {status}
                        </span>
                      )}
                      {isReview && allTasksCompleted && (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-500 text-white">
                          Ready
                        </span>
                      )}
                      {isReview && !allTasksCompleted && (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-400 text-white">
                          Locked
                        </span>
                      )}
                    </div>
                    {completed && !isReview && (
                      <div className="text-sm font-medium text-blue-700 mb-4">
                        🏅 Badge Earned
                      </div>
                    )}
                    {isReview && allTasksCompleted && (
                      <div className="text-sm font-medium text-purple-700 mb-4">
                        ✨ All tasks completed!
                      </div>
                    )}
                    {isReview && !allTasksCompleted && (
                      <div className="text-sm font-medium text-gray-500 mb-4">
                        Complete all tasks to unlock
                      </div>
                    )}
                    <button
                      onClick={() => !isDisabled && handleCardClick(task.routeKey)}
                      disabled={isDisabled}
                      className={`mt-2 px-5 py-2 rounded-full text-sm font-semibold transition ${
                        isDisabled
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : isReview
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isDisabled ? "Locked 🔒" : "Go →"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-5">
              {tasks.map((task, i) => {
                const status = getStatus(task.title);
                const completed = status === "Completed";
                const isReview = task.isReview;
                const isDisabled = isReview && !allTasksCompleted;
                
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-4 rounded-xl shadow-md transition ${
                      isDisabled 
                        ? "opacity-50 cursor-not-allowed" 
                        : ""
                    } ${
                      completed
                        ? "bg-blue-50 border border-blue-300"
                        : isReview
                        ? "bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-300"
                        : "bg-white border border-blue-100"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{task.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">
                          {task.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {isReview 
                            ? (allTasksCompleted ? "✨ Ready to Review" : "🔒 Complete all tasks first")
                            : (completed ? "✅ Completed" : "🕒 Pending")
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => !isDisabled && handleCardClick(task.routeKey)}
                      disabled={isDisabled}
                      className={`px-4 py-2 rounded-full text-sm transition ${
                        isDisabled
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : isReview
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isDisabled ? "Locked" : "Go →"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tips Section */}
          <div className="max-w-4xl mx-auto mt-16 bg-blue-50 border border-blue-100 rounded-2xl shadow p-6">
            <h3 className="text-2xl font-bold text-blue-900 mb-3">💡 Tips</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Complete each stage to finish onboarding smoothly.</li>
              <li>Stay organized and monitor your progress.</li>
              <li>Reach out if you need assistance anytime.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
