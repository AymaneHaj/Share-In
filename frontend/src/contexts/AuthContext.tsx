// src/contexts/AuthContext.tsx
import { createContext, useState, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import * as authService from "../services/authService";

// 1. Export the User interface so services can use it too
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

// 2. Define the Context shape
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    username: string,
    email: string,
    password: string,
    name: string
  ) => Promise<User>;
  logout: () => void;
}

// 3. Create the Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Create the Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session in localStorage on app load
  useEffect(() => {
    const checkUserSession = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("access_token");

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to parse stored user data", error);
        authService.logoutUser(); // Clean up bad data
      } finally {
        setIsLoading(false);
      }
    };
    checkUserSession();
  }, []);

  // "Smart" Login: Context calls the service
  const login = async (email: string, password: string) => {
    try {
      const { user } = await authService.loginUser(email, password);
      setUser(user);
      return user;
    } catch (error) {
      console.error("Login failed in context:", error);
      throw error; // Re-throw error so LoginPage can catch it
    }
  };

  // "Smart" Register: Context calls the service
  const register = async (
    username: string,
    email: string,
    password: string,
    name: string
  ) => {
    try {
      const { user } = await authService.registerUser(
        username,
        email,
        password,
        name
      );
      setUser(user);
      return user;
    } catch (error) {
      console.error("Registration failed in context:", error);
      throw error; // Re-throw error so RegisterPage can catch it
    }
  };

  // "Smart" Logout
  const logout = () => {
    authService.logoutUser();
    setUser(null);
    // No hard reload needed. ProtectedRoute will handle the redirect.
  };

  // Provide the values to the rest of the app
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Don't render children until we've checked localStorage */}
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// 5. Custom Hook (L-Hook l-Sahl)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
