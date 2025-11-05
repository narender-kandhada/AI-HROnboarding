import React from "react";

export default function OrientationSessionCard({ completed, onToggle }) {
  const handleYes = () => {
    if (!completed) onToggle();
  };

  const handleNo = () => {
    if (completed) onToggle();
  };

  return (
    <li
      className={`flex flex-col gap-2 p-4 rounded-xl border shadow-md transition-colors duration-300 ${
        completed
          ? "bg-green-100 border-green-400" // ✅ Lighter green background
          : "bg-white border-gray-300" // default white background
      }`}
    >
      {/* Task Title */}
      <div
        className={`text-base font-semibold ${
          completed ? "text-green-800" : "text-gray-800"
        }`}
      >
        Attend HR orientation session
      </div>

      {/* Question + Inline Buttons */}
      <div className="flex justify-between items-center mt-1">
        <span
          className={`text-sm ${
            completed ? "text-green-700" : "text-gray-700"
          }`}
        >
          Have you attended the HR orientation session?
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleYes}
            className={`px-3 py-1 text-sm font-medium rounded shadow ${
              completed
                ? "bg-green-500 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            ✅ Yes
          </button>
          <button
            onClick={handleNo}
            className={`px-3 py-1 text-sm font-medium rounded shadow ${
              !completed
                ? "bg-gray-500 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            ❌ No
          </button>
        </div>
      </div>

      {/* YES Description */}
      {completed && (
        <div className="text-sm text-green-700 mt-2">
          ✅ Great! You’ve completed the orientation. You’re now ready to explore your team and tools.
        </div>
      )}

      {/* NO Description */}
      {!completed && (
        <div className="text-sm text-gray-600 mt-4">
          The HR orientation session helps you understand company policies, culture, and benefits.
          <br />
          If you haven’t attended it yet, please check your calendar invite or contact{" "}
          <a href="mailto:hr@sumerudigitals.com" className="text-blue-600 underline">
            hr@sumerudigitals.com
          </a>.
        </div>
      )}
    </li>
  );
}
