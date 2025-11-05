import React from "react";

export default function EmailSetupCard({ completed, onToggle }) {
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
        Set up company email & accounts
      </div>

      {/* Question + Inline Buttons */}
      <div className="flex justify-between items-center mt-1">
        <span
          className={`text-sm ${
            completed ? "text-green-700" : "text-gray-700"
          }`}
        >
          Have you received your email credential mail?
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
          ✅ You can now access:
          <ul className="list-disc ml-5 mt-1">
            <li>
              <a
                href="https://mail.hostinger.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Company Email
              </a>
            </li>
            <li>
              <a
                href="https://company.slack.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Slack Workspace
              </a>
            </li>
          </ul>
        </div>
      )}

      {/* NO Description */}
      {!completed && (
        <div className="text-sm text-gray-600 mt-4">
          Your company email is being set up for you! You’ll receive credentials via personal email once ready.
          <br />
          If you haven’t received them, contact{" "}
          <a href="mailto:it@sumerudigitals.com" className="text-blue-600 underline">
            it@sumerudigitals.com
          </a>.
        </div>
      )}
    </li>
  );
}
