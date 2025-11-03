import api from "./api";

// We assume AuthContext will export this type
// This creates a dependency, so AuthContext must be updated
import type { User } from "../contexts/AuthContext";

interface AuthResponse {
  user: User;
  access_token: string;
}

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

export const registerUser = async (
  username: string,
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> => {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    password,
    name,
  });

  if (response.data.access_token && response.data.user) {
    localStorage.setItem("access_token", response.data.access_token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  // Optional: call backend logout
  // api.post('/api/auth/logout');
};
