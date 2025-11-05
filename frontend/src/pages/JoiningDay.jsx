import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SumeruLogo from "../assets/sumeru-logo.png";
import EmailSetupCard from "../components/EmailSetupCard";
import OrientationSessionCard from "../components/OrientationSessionCard";
import { completeModule } from "../utils/moduleProgress";
import { getApiUrl } from "../utils/apiConfig";

export default function JoiningDay() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [policyText, setPolicyText] = useState("");

  const navigate = useNavigate();
  const { token } = useParams();

  const API_URL = getApiUrl();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Fetch existing status from backend
        const res = await fetch(`${API_URL}/tasks/status/joining-day/${token}`);
        if (res.ok) {
          const data = await res.json();
          const hydratedTasks = [
            {
              id: 1,
              name: "Set up company email & accounts",
              completed: data.email_setup || false,
            },
            {
              id: 2,
              name: "Attend HR orientation session",
              completed: data.orientation_attended || false,
            },
            {
              id: 3,
              name: "Complete policy review & acknowledgment forms",
              completed: data.policy_acknowledged || false,
            },
          ];
          setTasks(hydratedTasks);
          setPolicyAccepted(data.policy_acknowledged || false);
          setSaved(true);
        } else {
          // If no status found, initialize with default tasks
          const mockTasks = [
            { id: 1, name: "Set up company email & accounts", completed: false },
            { id: 2, name: "Attend HR orientation session", completed: false },
            { id: 3, name: "Complete policy review & acknowledgment forms", completed: false },
          ];
          setTasks(mockTasks);
        }
      } catch (err) {
        console.error("❌ Failed to fetch tasks:", err);
        // Initialize with default tasks on error
        const mockTasks = [
          { id: 1, name: "Set up company email & accounts", completed: false },
          { id: 2, name: "Attend HR orientation session", completed: false },
          { id: 3, name: "Complete policy review & acknowledgment forms", completed: false },
        ];
        setTasks(mockTasks);
      } finally {
        setLoading(false);
      }
    };

    const fetchPolicyText = async () => {
      try {
        const res = await fetch("/company-policy.txt");
        const text = await res.text();
        setPolicyText(text);
      } catch (err) {
        console.error("❌ Failed to load policy text:", err);
      }
    };

    fetchTasks();
    fetchPolicyText();
  }, [token, API_URL]);

  const toggleTask = async (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    setSaved(false);

    // Track module progress
    if (token) {
      const task = updatedTasks.find(t => t.id === id);
      if (task?.completed) {
        // Map task IDs to module keys
        const moduleMap = {
          1: "email_setup",
          2: "orientation",
          3: "policy_acknowledgment"
        };
        const moduleKey = moduleMap[id];
        if (moduleKey) {
          await completeModule(token, "Joining Day", moduleKey);
        }
      }
    }
  };

  const allTasksCompleted = tasks.every((task) => task.completed);

  const handlePrevious = () => {
    navigate(`/personal-details/${token}`);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          task: "Joining Day",
        }),
      });

      if (res.ok) {
        setSaved(true);
        alert("✅ Joining Day progress saved!");
        
        // Ensure all completed modules are tracked
        if (token) {
          tasks.forEach((task) => {
            if (task.completed) {
              const moduleMap = {
                1: "email_setup",
                2: "orientation",
                3: "policy_acknowledgment"
              };
              const moduleKey = moduleMap[task.id];
              if (moduleKey) {
                completeModule(token, "Joining Day", moduleKey);
              }
            }
          });
        }
      } else {
        alert("❌ Failed to save progress.");
      }
    } catch (err) {
      console.error("❌ Error connecting to backend:", err);
      alert("❌ Error saving progress.");
    }
  };

  const handleNext = () => {
    if (saved) {
      navigate(`/training/${token}`, {
        state: { joiningDay: { tasks, completed: allTasksCompleted } },
      });
    }
  };

  const handlePolicyAccept = () => {
    setPolicyAccepted(true);
    setShowPolicyDialog(false);
    toggleTask(3);
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#D0DEEB] flex items-center justify-center">
        <p className="text-gray-700 text-base">Loading your Joining Day tasks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#D0DEEB] text-gray-800">
      {/* 🔷 Header Bar */}
      <div className="bg-blue-950 text-white px-10 py-6 flex flex-col lg:flex-row items-center lg:justify-between shadow-md fixed top-0 left-0 w-full z-50">
        <div className="flex items-center space-x-3">
          <img src={SumeruLogo} alt="Sumeru Logo" className="w-[300px]" />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="text-2xl font-bold text-white">👋 Welcome to Joining Day</h1>
          <p className="text-blue-200 font-medium text-sm tracking-wide mt-1">
            Let's get you started on your first day with us!
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="bg-white text-blue-800 px-4 py-2 rounded hover:bg-gray-100 transition"
            onClick={() => navigate(`/dashboard/${token}`)}
          >
            Home
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 pt-36 pb-12">
        {/* Progress Bar */}
        <div className="w-full bg-gray-300 rounded-full h-3 mb-8">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{
              width: `${(tasks.filter((t) => t.completed).length / tasks.length) * 100}%`,
            }}
          ></div>
        </div>

        {/* Task Section */}
        <h2 className="text-xl font-semibold text-blue-800 mb-6 text-center">
          🎯 Your Onboarding Tasks
        </h2>

        <div className="flex flex-col gap-6">
          {tasks.map((task) => {
            if (task.name === "Set up company email & accounts") {
              return (
                <EmailSetupCard
                  key={task.id}
                  completed={task.completed}
                  onToggle={() => toggleTask(task.id)}
                />
              );
            }

            if (task.name === "Attend HR orientation session") {
              return (
                <OrientationSessionCard
                  key={task.id}
                  completed={task.completed}
                  onToggle={() => toggleTask(task.id)}
                />
              );
            }

            if (task.name === "Complete policy review & acknowledgment forms") {
              return (
                <div
                  key={task.id}
                  className={`w-full p-6 rounded-xl border shadow-md transition-colors duration-300 ${
                    task.completed
                      ? "bg-green-100 border-green-400"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <span
                      className={`text-lg font-semibold ${
                        task.completed ? "text-green-800" : "text-blue-800"
                      }`}
                    >
                      Complete policy review & acknowledgment forms
                    </span>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPolicyDialog(true);
                      }}
                      className="text-blue-600 underline hover:text-blue-800 text-sm"
                    >
                      View policies
                    </a>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={policyAccepted}
                        onChange={() => {
                          setPolicyAccepted(!policyAccepted);
                          toggleTask(3);
                        }}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <label className="text-sm text-gray-700">
                        I acknowledge that I have read and accepted the company policies.
                      </label>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Policy Dialog */}
        {showPolicyDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">Company Policies</h2>
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-[60vh] overflow-y-auto pr-2">
                {policyText || "Loading policy content..."}
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowPolicyDialog(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePolicyAccept}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="flex justify-center items-center mt-12 gap-6 flex-wrap w-full">
          <button
            className="px-8 py-3 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-lg"
            onClick={handlePrevious}
          >
            ← Previous
          </button>

          <button
            onClick={handleSave}
            disabled={!allTasksCompleted}
            className={`px-8 py-3 rounded text-white font-medium text-lg ${
              allTasksCompleted ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Save Progress
          </button>

          <button
            onClick={handleNext}
            disabled={!saved || !allTasksCompleted}
            className={`px-8 py-3 rounded text-white font-medium text-lg ${
              saved && allTasksCompleted
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
