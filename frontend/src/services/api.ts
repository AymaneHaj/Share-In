// src/services/api.ts
import axios from "axios";
import { API_BASE_URL } from "../config/config";

// 1. Create the central Axios instance
const api = axios.create({
  baseURL: API_BASE_URL
});

// 2. Request Interceptor (Adds the token)
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

// 3. Response Interceptor (Handles 401 Unauthorized)
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // Check if the error is a 401
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      console.error("Unauthorized. Token expired or invalid. Logging out.");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      // Force reload to login page to clear all app state
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
