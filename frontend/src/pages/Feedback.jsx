// src/pages/Feedback.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SumeruLogo from "../assets/sumeru-logo.png";
import { completeModule } from "../utils/moduleProgress";
import { getApiUrl } from "../utils/apiConfig";

export default function Feedback() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    feedback: "",
    rating: 0,
  });
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasExistingFeedback, setHasExistingFeedback] = useState(false);

  const navigate = useNavigate();
  const { token } = useParams();
  const location = useLocation();
  const API_URL = getApiUrl();

  /** Fetch employee details and existing feedback */
  useEffect(() => {
    async function fetchEmployee() {
      try {
        const res = await fetch(`${API_URL}/employees/by-token/${token}`);
        if (!res.ok) throw new Error("Employee not found");
        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          name: data.name,
          email: data.email,
        }));
      } catch (err) {
        console.error("Failed to fetch employee", err);
      }
    }
    
    async function fetchExistingFeedback() {
      try {
        const res = await fetch(`${API_URL}/feedback/by-token/${token}`);
        if (res.ok) {
          const feedback = await res.json();
          if (feedback && feedback.rating) {
            setForm((prev) => ({
              ...prev,
              rating: feedback.rating,
              feedback: feedback.message || "",
            }));
            setHasExistingFeedback(true);
            setSaved(true); // Mark as saved so Next button is enabled
            // Don't set submitted=true so user can still edit and update
          }
        }
      } catch (err) {
        console.error("Failed to fetch existing feedback", err);
      }
    }
    
    fetchEmployee();
    fetchExistingFeedback();
  }, [token]);

  /** Handle field changes */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
    setSubmitted(false); // Allow resubmission if feedback was already submitted
  };

  /** Handle star rating */
  const handleRating = (value) => {
    setForm((prev) => ({ ...prev, rating: value }));
    setSaved(false);
    setSubmitted(false); // Allow resubmission if feedback was already submitted
  };

  /** Submit feedback */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.feedback && form.rating > 0) {
      try {
        const payload = {
          token,
          message: form.feedback,
          rating: form.rating,
        };

        const wasUpdate = hasExistingFeedback;
        const res = await fetch(`${API_URL}/feedback/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setSubmitted(true);
          setHasExistingFeedback(true);
          setSaved(true);
          toast.success(
            wasUpdate 
              ? "✅ Feedback updated successfully!" 
              : "✅ Feedback submitted successfully!", 
            {
              position: "top-center",
              autoClose: 3000,
            }
          );
          
          // Track module progress
          if (token) {
            // Rating module
            if (form.rating > 0) {
              await completeModule(token, "Feedback", "rating");
            }
            // Comments module
            if (form.feedback) {
              await completeModule(token, "Feedback", "comments");
            }
            // Submission module
            await completeModule(token, "Feedback", "submission");
          }
        } else {
          toast.error("❌ Failed to submit feedback");
        }
      } catch (err) {
        console.error("Failed to submit feedback", err);
      }
    }
  };

  /** Save progress */
  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          task: "Feedback",
        }),
      });

      if (res.ok) {
        setSaved(true);
        alert("✅ Feedback progress saved");
      } else {
        alert("❌ Failed to save progress");
      }
    } catch (err) {
      console.error("Error saving progress:", err);
      alert("❌ Error connecting to backend");
    }
  };

  /** Navigation handlers */
  const handlePrevious = () => {
    navigate(`/department-intro/${token}`, {
      state: {
        ...location.state,
        feedbackData: form,
      },
    });
  };

  const handleNext = () => {
    if (saved && (submitted || hasExistingFeedback)) {
      navigate(`/pre-review/${token}`, { 
        state: { 
          ...location.state,
          feedbackData: form 
        } 
      });
    }
  };

  /** Render */
  return (
    <div className="min-h-screen bg-[#D0DEEB] text-gray-800">
      {/* Header Bar */}
      <div className="bg-blue-950 text-white px-10 py-6 flex flex-col lg:flex-row items-center lg:justify-between shadow-md fixed top-0 left-0 w-full z-50">
        <div className="flex items-center space-x-3">
          <img src={SumeruLogo} alt="Logo" className="w-[280px]" />
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
          <h1 className="text-2xl font-bold">📝 Feedback</h1>
          <p className="text-blue-200 font-medium text-sm tracking-wide mt-1">
            Share your onboarding experience
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

      {/* Feedback Form */}
      <div className="max-w-5xl mx-auto px-6 pt-36 pb-24">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg border border-blue-200 p-10"
        >
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Onboarding Feedback 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            We'd love to hear your thoughts about your onboarding journey.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <input
              type="text"
              name="name"
              value={form.name}
              readOnly
              className="bg-gray-100 border border-gray-300 px-4 py-3 rounded text-gray-700 w-full"
              required
            />
            <input
              type="email"
              name="email"
              value={form.email}
              readOnly
              className="bg-gray-100 border border-gray-300 px-4 py-3 rounded text-gray-700 w-full"
              required
            />
          </div>

          <textarea
            name="feedback"
            placeholder="Write your feedback here..."
            value={form.feedback}
            onChange={handleChange}
            rows={6}
            className="bg-gray-50 border border-gray-300 px-4 py-3 rounded text-gray-700 resize-none w-full mb-6"
            required
          />

          {/* Rating and Submit */}
          <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRating(star)}
                  className={`w-10 h-10 flex items-center justify-center text-2xl transition cursor-pointer ${
                    form.rating >= star
                      ? "text-yellow-400"
                      : "text-gray-400 hover:text-yellow-300"
                  }`}
                  style={{ backgroundColor: "transparent" }}
                >
                  ★
                </button>
              ))}
              {hasExistingFeedback && form.rating > 0 && (
                <span className="text-sm text-blue-600 ml-2 flex items-center font-medium">
                  (You can edit and update your feedback)
                </span>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-2 font-medium rounded bg-green-600 hover:bg-green-700 text-white transition"
            >
              {hasExistingFeedback ? "Update Feedback" : "Submit Feedback"}
            </button>
          </div>

          {/* Info Box */}
          <div className="border border-blue-100 p-6 rounded bg-blue-50">
            <h3 className="text-lg font-semibold mb-2 text-blue-800">
              Why your feedback matters
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Helps HR improve the onboarding experience</li>
              <li>Highlights areas where training can be enhanced</li>
              <li>Encourages continuous improvement</li>
            </ul>
          </div>
        </form>

        {/* Bottom Navigation */}
        <div className="flex justify-center items-center mt-14 gap-6 flex-wrap">
          <button
            type="button"
            onClick={handlePrevious}
            className="px-8 py-3 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            ← Previous
          </button>
          <button
            onClick={handleSave}
            disabled={!submitted && !hasExistingFeedback}
            className={`px-8 py-3 rounded text-white ${
              submitted || hasExistingFeedback
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Save Progress
          </button>
          <button
            onClick={handleNext}
            disabled={!saved || (!submitted && !hasExistingFeedback)}
            className={`px-8 py-3 rounded text-white ${
              saved && (submitted || hasExistingFeedback)
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
