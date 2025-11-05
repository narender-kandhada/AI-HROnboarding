import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import SumeruLogo from "../assets/sumeru-logo.png";
import { getApiUrl } from "../utils/apiConfig";

export default function PreReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useParams() || {};
  const API_URL = getApiUrl();

  const [employee, setEmployee] = useState(null);
  const [personalInfo, setPersonalInfo] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [completedJoiningDayModules, setCompletedJoiningDayModules] = useState([]);
  const [completedTrainingModules, setCompletedTrainingModules] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch employee data
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        // Try to get from location state
        const locationState = location.state?.feedbackData;
        if (!locationState) {
          setLoading(false);
          return;
        }
      }

      try {
        // Fetch employee basic info
        if (token) {
          const empRes = await fetch(`${API_URL}/employees/by-token/${token}`);
          if (empRes.ok) {
            const empData = await empRes.json();
            setEmployee(empData);

            // Fetch personal info
            const personalRes = await fetch(`${API_URL}/employees/by-token/${token}/personal-info`);
            if (personalRes.ok) {
              const personalData = await personalRes.json();
              setPersonalInfo(personalData);
            }

            // Fetch completed tasks
            const tasksRes = await fetch(`${API_URL}/employees/${empData.emp_id}/completed-tasks`);
            if (tasksRes.ok) {
              const tasksData = await tasksRes.json();
              setCompletedTasks(tasksData.tasks || []);
            }

            // Fetch module progress to get actual completed modules
            const moduleProgressRes = await fetch(`${API_URL}/module-progress/employee/${token}`);
            if (moduleProgressRes.ok) {
              const moduleProgressData = await moduleProgressRes.json();
              const tasks = moduleProgressData.tasks || [];
              
              // Get completed modules for Joining Day
              const joiningDayTask = tasks.find(t => t.task_title === "Joining Day");
              if (joiningDayTask) {
                const completed = joiningDayTask.modules
                  .filter(m => m.status === "completed")
                  .map(m => m.module_name || m.module_key);
                setCompletedJoiningDayModules(completed);
              }
              
              // Get completed modules for Training
              const trainingTask = tasks.find(t => t.task_title === "Training");
              if (trainingTask) {
                const completed = trainingTask.modules
                  .filter(m => m.status === "completed")
                  .map(m => m.module_name || m.module_key);
                setCompletedTrainingModules(completed);
              }
            }

            // Fetch feedback
            const feedbackRes = await fetch(`${API_URL}/feedback/employee/${empData.emp_id}`);
            if (feedbackRes.ok) {
              const feedbackData = await feedbackRes.json();
              setFeedback(feedbackData);
            }
          }
        }

        // Get data from location state as fallback
        const state = location.state || {};
        if (state.personalDetails) {
          setPersonalInfo(state.personalDetails);
        }
        if (state.trainingModules) {
          // Extract completed training modules from state
          const completed = Array.isArray(state.trainingModules)
            ? state.trainingModules.filter(m => typeof m === "object" ? m.status === "completed" : true)
            : [];
          setCompletedTrainingModules(completed.map(m => typeof m === "string" ? m : m.module_name || m.name || m));
        }
        if (state.feedbackData) {
          setFeedback(state.feedbackData);
        }
        if (state.joiningDay?.tasks) {
          setCompletedTasks(state.joiningDay.tasks);
        }
        if (state.joiningDay?.modules) {
          // Extract completed joining day modules from state
          const completed = Array.isArray(state.joiningDay.modules)
            ? state.joiningDay.modules.filter(m => typeof m === "object" ? m.status === "completed" : true)
            : [];
          setCompletedJoiningDayModules(completed.map(m => typeof m === "string" ? m : m.module_name || m.name || m));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, location.state, API_URL]);

  const handleFinalSubmit = () => {
    if (token) {
      navigate(`/dashboard/${token}`);
    } else {
      navigate("/");
    }
  };

  const allCompleted = employee && personalInfo && completedTasks.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#D0DEEB] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#D0DEEB] text-gray-800">
      {/* Header Bar */}
      <div className="bg-blue-950 text-white px-10 py-6 flex flex-col lg:flex-row items-center lg:justify-between shadow-md fixed top-0 left-0 w-full z-50">
        <div className="flex items-center space-x-3">
          <img src={SumeruLogo} alt="Sumeru Logo" className="w-[300px]" />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="text-2xl font-bold text-white">📋 Final Review</h1>
          <p className="text-blue-200 font-medium text-sm tracking-wide mt-1">
            Review all your onboarding details before submission
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="bg-white text-blue-800 px-4 py-2 rounded hover:bg-gray-100 transition"
            onClick={() => token ? navigate(`/dashboard/${token}`) : navigate("/")}
          >
            Home
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 pt-36 pb-10 text-gray-800">
        {/* Success Banner */}
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-8">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <p className="font-semibold text-lg">All Steps Completed!</p>
              <p className="text-sm">Please review all your details below before final submission.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
              <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                <span className="mr-2">👤</span> Personal Details
              </h2>
              <div className="space-y-3 text-gray-700">
                <div>
                  <strong className="text-blue-700">Name:</strong>{" "}
                  <span>{employee?.name || personalInfo?.name || "—"}</span>
                </div>
                <div>
                  <strong className="text-blue-700">Email:</strong>{" "}
                  <span>{employee?.email || personalInfo?.email || "—"}</span>
                </div>
                <div>
                  <strong className="text-blue-700">Role:</strong>{" "}
                  <span>{employee?.role || personalInfo?.role || "—"}</span>
                </div>
                <div>
                  <strong className="text-blue-700">Department:</strong>{" "}
                  <span>{employee?.department || "—"}</span>
                </div>
                <div>
                  <strong className="text-blue-700">Date of Birth:</strong>{" "}
                  <span>{personalInfo?.dob || personalInfo?.dateOfBirth || "—"}</span>
                </div>
                <div>
                  <strong className="text-blue-700">Mobile:</strong>{" "}
                  <span>{personalInfo?.mobile || "—"}</span>
                </div>
                <div>
                  <strong className="text-blue-700">Gender:</strong>{" "}
                  <span>{personalInfo?.gender || personalInfo?.sex || "—"}</span>
                </div>
              </div>
            </div>

            {/* Family Details */}
            <div className="bg-purple-50 rounded-xl p-6 border-l-4 border-purple-500">
              <h2 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
                <span className="mr-2">👨‍👩‍👧</span> Family Details
              </h2>
              <div className="space-y-3 text-gray-700">
                {personalInfo?.family1_name && (
                  <div>
                    <strong className="text-purple-700">Family Member 1:</strong>
                    <div className="ml-4 mt-1">
                      <div>Name: {personalInfo.family1_name}</div>
                      <div>Relation: {personalInfo.family1_relation || "—"}</div>
                      <div>Mobile: {personalInfo.family1_mobile || "—"}</div>
                    </div>
                  </div>
                )}
                {personalInfo?.family2_name && (
                  <div>
                    <strong className="text-purple-700">Family Member 2:</strong>
                    <div className="ml-4 mt-1">
                      <div>Name: {personalInfo.family2_name}</div>
                      <div>Relation: {personalInfo.family2_relation || "—"}</div>
                      <div>Mobile: {personalInfo.family2_mobile || "—"}</div>
                    </div>
                  </div>
                )}
                {!personalInfo?.family1_name && !personalInfo?.family2_name && (
                  <p className="text-gray-500 italic">No family details available</p>
                )}
              </div>
            </div>

            {/* Document Details */}
            <div className="bg-indigo-50 rounded-xl p-6 border-l-4 border-indigo-500">
              <h2 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center">
                <span className="mr-2">📄</span> Document Details
              </h2>
              <div className="space-y-2 text-gray-700">
                <div>
                  <strong className="text-indigo-700">Aadhaar:</strong>{" "}
                  <span>{personalInfo?.aadhaar_number || "—"}</span>
                </div>
                <div>
                  <strong className="text-indigo-700">PAN:</strong>{" "}
                  <span>{personalInfo?.pan_number || "—"}</span>
                </div>
                <div>
                  <strong className="text-indigo-700">Bank Account:</strong>{" "}
                  <span>{personalInfo?.bank_number || "—"}</span>
                </div>
                <div>
                  <strong className="text-indigo-700">IFSC Code:</strong>{" "}
                  <span>{personalInfo?.ifsc_code || "—"}</span>
                </div>
              </div>
            </div>

            {/* Joining Day Tasks */}
            <div className="bg-green-50 rounded-xl p-6 border-l-4 border-green-500">
              <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                <span className="mr-2">🎉</span> Joining Day Tasks
              </h2>
              {completedJoiningDayModules.length > 0 ? (
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {completedJoiningDayModules.map((module, i) => (
                    <li key={i}>{module}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No joining day modules completed yet</p>
              )}
            </div>

            {/* Training Modules */}
            <div className="bg-yellow-50 rounded-xl p-6 border-l-4 border-yellow-500">
              <h2 className="text-xl font-semibold text-yellow-800 mb-4 flex items-center">
                <span className="mr-2">📚</span> Training Modules
              </h2>
              {completedTrainingModules.length > 0 ? (
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {completedTrainingModules.map((module, i) => (
                    <li key={i}>{module}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No training modules completed yet</p>
              )}
            </div>

            {/* Feedback */}
            <div className="bg-pink-50 rounded-xl p-6 border-l-4 border-pink-500">
              <h2 className="text-xl font-semibold text-pink-800 mb-4 flex items-center">
                <span className="mr-2">💬</span> Feedback
              </h2>
              {feedback ? (
                <div className="space-y-3 text-gray-700">
                  <div>
                    <strong className="text-pink-700">Name:</strong>{" "}
                    <span>{feedback.name || employee?.name || "—"}</span>
                  </div>
                  <div>
                    <strong className="text-pink-700">Email:</strong>{" "}
                    <span>{feedback.email || employee?.email || "—"}</span>
                  </div>
                  {feedback.rating && (
                    <div>
                      <strong className="text-pink-700">Rating:</strong>{" "}
                      <span className="text-yellow-500">
                        {"★".repeat(feedback.rating)}{"☆".repeat(5 - feedback.rating)}
                      </span>
                    </div>
                  )}
                  {feedback.submitted_at && (
                    <div>
                      <strong className="text-pink-700">Submitted:</strong>{" "}
                      <span>{new Date(feedback.submitted_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  )}
                  <div>
                    <strong className="text-pink-700">Feedback:</strong>
                    <p className="mt-2 whitespace-pre-line bg-white p-4 rounded border border-pink-200">
                      {feedback.feedback || feedback.message || "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No feedback submitted yet</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-10">
            <button
              onClick={handleFinalSubmit}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-10 py-3 rounded-lg shadow-md transition-all duration-300 text-lg flex items-center gap-2"
            >
              <span>✅</span>
              <span>Complete Onboarding & Return to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
