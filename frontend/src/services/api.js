import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  updateProfile: (data) => api.patch("/auth/update-profile", data),
  changePassword: (data) => api.patch("/auth/change-password", data),
};

export const reviewApi = {
  submit: (data) => api.post("/review", data),
};

export const historyApi = {
  list: (params) => api.get("/history", { params }),
  get: (id) => api.get(`/history/${id}`),
  favorite: (id) => api.patch(`/history/${id}/favorite`),
  tag: (id, tags) => api.patch(`/history/${id}/tags`, { tags }),
  delete: (id) => api.delete(`/history/${id}`),
};

export const dashboardApi = {
  get: () => api.get("/dashboard"),
};

export default api;
