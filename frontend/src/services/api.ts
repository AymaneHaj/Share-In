import axios from "axios";
// We assume config.ts is at src/config/config.ts
// The path from src/services/ is ../config/config.ts
import { API_BASE_URL } from "../config/config";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request Interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // Check if the error is a 401
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized. Logging out.");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      // Force reload to login page to clear all app state
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
