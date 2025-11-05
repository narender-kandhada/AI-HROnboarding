/**
 * Utility functions for tracking subtask/module progress
 */

import { getApiUrl } from "./apiConfig";

const API_URL = getApiUrl();

/**
 * Update module progress
 * @param {string} token - Employee token
 * @param {string} taskTitle - Main task title (e.g., "Personal Details")
 * @param {string} moduleKey - Module key (e.g., "basic_info")
 * @param {string} status - Status: "pending", "in_progress", or "completed"
 * @param {number} progressPercent - Progress percentage (0-100)
 */
export async function updateModuleProgress(
  token,
  taskTitle,
  moduleKey,
  status = "completed",
  progressPercent = 100
) {
  try {
    const response = await fetch(`${API_URL}/module-progress/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        task_title: taskTitle,
        module_key: moduleKey,
        status,
        progress_percent: progressPercent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to update module progress:", error);
      return false;
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating module progress:", error);
    return false;
  }
}

/**
 * Get all module progress for an employee
 * @param {string} token - Employee token
 * @returns {Promise<Object>} Progress data for all tasks
 */
export async function getEmployeeModuleProgress(token) {
  try {
    const response = await fetch(`${API_URL}/module-progress/employee/${token}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch module progress");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching module progress:", error);
    return null;
  }
}

/**
 * Get progress for a specific task
 * @param {string} token - Employee token
 * @param {string} taskTitle - Task title
 * @returns {Promise<Object>} Progress data for the task
 */
export async function getTaskProgress(token, taskTitle) {
  try {
    const response = await fetch(
      `${API_URL}/module-progress/task/${token}/${encodeURIComponent(taskTitle)}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch task progress");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching task progress:", error);
    return null;
  }
}

/**
 * Mark a module as completed
 * @param {string} token - Employee token
 * @param {string} taskTitle - Main task title
 * @param {string} moduleKey - Module key
 */
export async function completeModule(token, taskTitle, moduleKey) {
  return updateModuleProgress(token, taskTitle, moduleKey, "completed", 100);
}

/**
 * Mark a module as in progress
 * @param {string} token - Employee token
 * @param {string} taskTitle - Main task title
 * @param {string} moduleKey - Module key
 * @param {number} progressPercent - Progress percentage (0-100)
 */
export async function startModule(token, taskTitle, moduleKey, progressPercent = 50) {
  return updateModuleProgress(token, taskTitle, moduleKey, "in_progress", progressPercent);
}

