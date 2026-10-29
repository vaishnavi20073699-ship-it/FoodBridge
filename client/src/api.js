const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "/api";

export function getToken() {
  return localStorage.getItem("foodbridge_token");
}

export function setSession(data) {
  localStorage.setItem("foodbridge_token", data.token);
  localStorage.setItem("foodbridge_user", JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem("foodbridge_token");
  localStorage.removeItem("foodbridge_user");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("foodbridge_user") || "null");
  } catch {
    return null;
  }
}

export async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      window.dispatchEvent(new Event("foodbridge:logout"));
    }
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export const post = (path, body) =>
  api(path, { method: "POST", body: JSON.stringify(body) });

export const patch = (path, body) =>
  api(path, { method: "PATCH", body: JSON.stringify(body) });