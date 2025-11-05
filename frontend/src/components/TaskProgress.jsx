import React from "react";

function TaskProgress({ tasks }) {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Onboarding Task Progress 📊
      </h1>

      {tasks.length === 0 ? (
        <p className="text-gray-600">No tasks available.</p>
      ) : (
        <div className="space-y-6">
          {tasks.map((task, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span
                  className={`font-medium ${
                    task.completed ? "line-through text-gray-500" : "text-gray-800"
                  }`}
                >
                  {task.name}
                </span>
                <span className="text-sm text-gray-600">
                  {task.completed ? "Completed ✅" : "Pending ⏳"}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    task.completed ? "bg-green-500" : "bg-blue-400"
                  }`}
                  style={{ width: task.completed ? "100%" : "50%" }}
                  aria-label={`Progress for ${task.name}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <h2 className="font-semibold mb-2 text-gray-800">Tips to complete tasks:</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Follow the onboarding stages in order</li>
          <li>Mark tasks complete only after finishing them fully</li>
          <li>Reach out to your mentor if you are stuck</li>
          <li>Check back regularly for updates or new tasks</li>
        </ul>
      </div>
    </div>
  );
}

export default TaskProgress;

