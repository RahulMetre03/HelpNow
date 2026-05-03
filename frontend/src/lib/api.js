const API_BASE = "https://helpnow-backend.onrender.com";

function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("helpnow_token");
  }
  return null;
}

export function setToken(token) {
  localStorage.setItem("helpnow_token", token);
}

export function setUser(user) {
  localStorage.setItem("helpnow_user", JSON.stringify(user));
}

export function getUser() {
  if (typeof window !== "undefined") {
    const u = localStorage.getItem("helpnow_user");
    return u ? JSON.parse(u) : null;
  }
  return null;
}

export function logout() {
  localStorage.removeItem("helpnow_token");
  localStorage.removeItem("helpnow_user");
  window.location.href = "/login";
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 400) {
    if (token) {
      logout();
      throw new Error("Invalid credentials");
    }
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Invalid credentials");
  }

  if (res.status === 401) {
    if (token) {
      logout();
      throw new Error("Session expired");
    }
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Invalid credentials");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "API Error");
  }

  return res.json();
}

// Auth
export const api = {
  signup: (data) => apiFetch("/api/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => apiFetch("/api/auth/me"),

  // Therapists
  getTherapists: (spec, city) => {
    const params = new URLSearchParams();
    if (spec) params.set("specialization", spec);
    if (city) params.set("city", city);
    const qs = params.toString();
    return apiFetch(`/api/therapists/${qs ? `?${qs}` : ""}`);
  },
  getTherapist: (id) => apiFetch(`/api/therapists/${id}`),
  getTherapistSlots: (id, date) => apiFetch(`/api/therapists/${id}/slots?date=${date}`),
  getMyTherapistProfile: () => apiFetch("/api/therapists/me"),
  updateTherapistProfile: (data) => apiFetch("/api/therapists/me", { method: "PATCH", body: JSON.stringify(data) }),
  setAvailability: (slots) => apiFetch("/api/therapists/availability", { method: "PUT", body: JSON.stringify(slots) }),

  // Appointments
  createAppointment: (data) => apiFetch("/api/appointments/", { method: "POST", body: JSON.stringify(data) }),
  getAppointments: () => apiFetch("/api/appointments/"),
  updateAppointment: (id, data) => apiFetch(`/api/appointments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Chat
  createSession: (appointmentId, title) => apiFetch("/api/chat/sessions", { method: "POST", body: JSON.stringify({ appointment_id: appointmentId, title }) }),
  getSessions: (appointmentId) => apiFetch(`/api/chat/sessions${appointmentId ? `?appointment_id=${appointmentId}` : ''}`),
  renameSession: (sessionId, title) => apiFetch(`/api/chat/sessions/${sessionId}`, { method: "PATCH", body: JSON.stringify({ title }) }),
  getMessages: (sessionId) => apiFetch(`/api/chat/sessions/${sessionId}/messages`),
  sendMessage: (sessionId, content) => apiFetch(`/api/chat/sessions/${sessionId}/messages`, { method: "POST", body: JSON.stringify({ content }) }),
};

// WebSocket
export function createChatWebSocket(sessionId) {
  const token = getToken();
  const wsBase = API_BASE.replace("http", "ws");
  return new WebSocket(`${wsBase}/api/chat/ws/${sessionId}?token=${token}`);
}
