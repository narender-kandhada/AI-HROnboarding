import { getApiUrl } from "./apiConfig";

const API_URL = getApiUrl();

export async function fetchEmployeeByToken(token) {
  const res = await fetch(`${API_URL}/employees/by-token/${token}`);
  if (!res.ok) throw new Error("Employee not found");
  return await res.json();
}

export async function fetchFeedbackByToken(token) {
  const res = await fetch(`${API_URL}/feedback/by-token/${token}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function fetchDepartmentIntroByToken(token) {
  const res = await fetch(`${API_URL}/department-intro/by-token/${token}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function fetchTrainingStatusByToken(token) {
  const res = await fetch(`${API_URL}/training/by-token/${token}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function fetchNDAUploadStatus(token) {
  const res = await fetch(`${API_URL}/nda/by-token/${token}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function fetchTaskCompletion(token, taskName) {
  const res = await fetch(`${API_URL}/tasks/status?token=${token}&task=${taskName}`);
  if (!res.ok) return null;
  return await res.json();
}








