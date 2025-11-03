// src/services/authService.ts
import api from "./api";
import type { User } from "../contexts/AuthContext"; // We'll export User from AuthContext

// Define the shape of the login response from the backend
interface AuthResponse {
  user: User;
  access_token: string;
}

/**
 * Calls the backend to log the user in.
 * Stores token and user in localStorage on success.
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post("/api/auth/login", { email, password });

  if (response.data.access_token && response.data.user) {
    localStorage.setItem("access_token", response.data.access_token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

/**
 * Calls the backend to register a new user.
 * Stores token and user in localStorage on success.
 */
export const registerUser = async (
  username: string,
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> => {
  const data = {
    username,
    email,
    password,
    name,
  };
  console.log("Sending registration data:", data);

  try {
    const response = await api.post("/api/auth/register", data);
    console.log("Registration response:", response.data);

    if (response.data.access_token && response.data.user) {
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error: any) {
    console.error("Registration error:", error.response?.data);
    throw error;
  }
};

/**
 * Clears session data from localStorage.
 */
export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  // Optionally, call the backend logout endpoint
  // api.post('/api/auth/logout');
};
