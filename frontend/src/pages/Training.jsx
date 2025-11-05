import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SumeruLogo from "../assets/sumeru-logo.png";
import { completeModule } from "../utils/moduleProgress";
import { getApiUrl } from "../utils/apiConfig";

export default function Training() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();
  const API_URL = getApiUrl();

  useEffect(() => {
    const fetchTrainingStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/training/status/${token}`);
        if (res.ok) {
          const data = await res.json();
          const hydratedModules = [
            { 
              id: 1, 
              name: "POSH Certification", 
              proofType: "posh_certification", 
              completed: data.posh_certification || false, 
              file: null 
            },
            { 
              id: 2, 
              name: "IT Systems Access", 
              proofType: "it_access", 
              completed: data.it_access || false, 
              file: null 
            },
            { 
              id: 3, 
              name: "Collaboration Training", 
              proofType: "collaboration_training", 
              completed: data.collaboration_training || false, 
              file: null 
            },
          ];
          setModules(hydratedModules);
          setSaved(true); // If modules are already completed, mark as saved
        } else {
          // If no status found, initialize with default modules
          const mockModules = [
            { id: 1, name: "POSH Certification", proofType: "posh_certification", completed: false, file: null },
            { id: 2, name: "IT Systems Access", proofType: "it_access", completed: false, file: null },
            { id: 3, name: "Collaboration Training", proofType: "collaboration_training", completed: false, file: null },
          ];
          setModules(mockModules);
        }
      } catch (err) {
        console.error("❌ Failed to fetch training status:", err);
        // Initialize with default modules on error
        const mockModules = [
          { id: 1, name: "POSH Certification", proofType: "posh_certification", completed: false, file: null },
          { id: 2, name: "IT Systems Access", proofType: "it_access", completed: false, file: null },
          { id: 3, name: "Collaboration Training", proofType: "collaboration_training", completed: false, file: null },
        ];
        setModules(mockModules);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingStatus();
  }, [token, API_URL]);

  const handleFileUpload = (id, file) => {
    // Validate PDF only
    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
      alert("❌ Only PDF files are allowed");
      return;
    }
    
    setModules((prev) =>
      prev.map((mod) => (mod.id === id ? { ...mod, file } : mod))
    );
  };

  const handleSubmit = async (id) => {
    const mod = modules.find((m) => m.id === id);
    if (!mod || !mod.file) return;

    const formData = new FormData();
    formData.append("token", token);
    formData.append(mod.proofType, mod.file);

    try {
      const res = await fetch(`${API_URL}/training/submit-proof`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setModules((prev) =>
          prev.map((m) => (m.id === id ? { ...m, completed: true } : m))
        );
        console.log(`✅ ${mod.proofType} uploaded`);
        
        // Track module progress
        if (token) {
          // Map training modules to module keys
          const moduleKeyMap = {
            "posh_certification": "company_culture",
            "it_access": "technical_training",
            "collaboration_training": "compliance_training"
          };
          const moduleKey = moduleKeyMap[mod.proofType];
          if (moduleKey) {
            await completeModule(token, "Training", moduleKey);
          }
        }
      } else {
        alert(`❌ Failed to upload ${mod.proofType}`);
      }
    } catch (err) {
      console.error(`❌ Error uploading ${mod.proofType}:`, err);
      alert(`❌ Upload error for ${mod.proofType}`);
    }
  };

  const handleUndo = (id) => {
    setModules((prev) =>
      prev.map((mod) =>
        mod.id === id ? { ...mod, completed: false, file: null } : mod
      )
    );
    setSaved(false);
  };

  const allCompleted = modules.every((mod) => mod.completed);

  const handlePrevious = () => {
    navigate(`/joining-day/${token}`);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, task: "Training" }),
      });

      if (res.ok) {
        setSaved(true);
        alert("✅ Training progress saved!");
      } else {
        alert("❌ Failed to save progress.");
      }
    } catch (err) {
      console.error("❌ Error connecting to backend:", err);
      alert("❌ Error saving progress.");
    }
  };

  const handleNext = () => {
    if (saved && allCompleted) {
      navigate(`/department-intro/${token}`, {
        state: {
          trainingModules: modules.map(({ name, completed }) => ({ name, completed })),
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#D0DEEB] flex items-center justify-center">
        <p className="text-gray-700 text-base">Loading your training modules...</p>
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
          <h1 className="text-2xl font-bold text-white">🎓 Training Modules</h1>
          <p className="text-blue-200 font-medium text-sm tracking-wide mt-1">
            Upload your certifications and complete onboarding training
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

      {/* Main Section */}
      <div className="max-w-5xl mx-auto px-6 pt-36 pb-16">
        {/* Progress Bar */}
        <div className="w-full bg-gray-300 rounded-full h-3 mb-8">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{
              width: `${(modules.filter((m) => m.completed).length / modules.length) * 100}%`,
            }}
          ></div>
        </div>

        <div className="flex flex-col gap-6">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className={`w-full p-6 rounded-xl border shadow-md transition ${
                mod.completed
                  ? "bg-green-50 border-green-400 shadow-green-200"
                  : "bg-white border-blue-300 shadow-gray-200"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-blue-800 mb-1">{mod.name}</h2>

                  {mod.name === "POSH Certification" && (
                    <a
                      href="https://www.skillindiadigital.gov.in/courses/detail/35d1b0e0-7dfb-4d07-a3d8-d6632ece72c8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800 text-sm"
                    >
                      Skill India POSH Certification
                    </a>
                  )}
                  {mod.name === "IT Systems Access" && (
                    <a
                      href="https://yourdomain.com/it-tools"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800 text-sm"
                    >
                      Access IT Setup Instructions
                    </a>
                  )}
                  {mod.name === "Collaboration Training" && (
                    <a
                      href="https://yourdomain.com/team-training"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800 text-sm"
                    >
                      Join Collaboration Training Session
                    </a>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      mod.completed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {mod.completed ? "Completed" : "Pending"}
                  </span>

                  {!mod.completed ? (
                    <>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(mod.id, e.target.files[0])}
                        className="text-sm text-gray-700 border rounded p-1 shadow-sm bg-white"
                      />
                      <button
                        onClick={() => handleSubmit(mod.id)}
                        disabled={!mod.file}
                        className={`px-4 py-1 text-sm rounded text-white font-medium ${
                          mod.file
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Submit
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleUndo(mod.id)}
                      className="px-4 py-1 text-sm rounded text-white font-medium bg-red-500 hover:bg-red-600"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>

              {mod.completed && (
                <div className="mt-2 text-green-700 font-semibold text-sm">
                  🏅 Badge Earned
                </div>
              )}
            </div>
          ))}

          {/* Tips Card */}
          <div className="w-full p-6 rounded-xl border shadow-md bg-white border-blue-300">
            <h3 className="text-lg font-semibold mb-2 text-blue-800">💡 Tips</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
              <li>Complete modules in order for best understanding</li>
              <li>Take notes or screenshots for future reference</li>
              <li>Ask your SUPA ChatBot if you have questions</li>
            </ul>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-center items-center mt-12 gap-6 flex-wrap w-full">
          <button
            className="px-8 py-3 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-lg"
            onClick={handlePrevious}
          >
            ← Previous
          </button>

          <button
            onClick={handleSave}
            disabled={!allCompleted}
            className={`px-8 py-3 rounded text-white font-medium text-lg ${
              allCompleted
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Save Progress
          </button>

          <button
            onClick={handleNext}
            disabled={!saved || !allCompleted}
            className={`px-8 py-3 rounded text-white font-medium text-lg ${
              saved && allCompleted
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
