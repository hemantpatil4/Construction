import axios from "axios";

// baseURL is empty so requests go through the same origin.
// In dev, Vite proxies /api/* to the backend.
// In production (OpenShift), Nginx reverse-proxies /api/* to backend services.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor: Attach JWT token ───
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor: Handle 401 ───
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Don't redirect here — let the Redux slice handle it
    }
    return Promise.reject(error);
  },
);

export default api;
