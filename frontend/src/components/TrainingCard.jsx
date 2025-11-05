import React from "react";

function TrainingCard({ module, onToggle }) {
  const { id, title, completed } = module;

  return (
    <div
      className={`p-4 border rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:shadow-md ${
        completed ? "bg-green-100 border-green-300" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex-1">
        <h2
          className={`text-lg font-semibold ${
            completed ? "line-through text-gray-500" : "text-gray-800"
          }`}
        >
          {title}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Status: {completed ? "Completed ✅" : "Pending ⏳"}
        </p>
      </div>

      <button
        onClick={() => onToggle(id)}
        aria-label={completed ? "Mark as incomplete" : "Mark as complete"}
        className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition ${
          completed ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {completed ? "Mark Incomplete" : "Mark Complete"}
      </button>
    </div>
  );
}
export default TrainingCard;




