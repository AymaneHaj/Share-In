// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth(); // Get the "smart" login function
  const navigate = useNavigate();
  const location = useLocation();

  // Find out where to redirect the user after login based on role
  const getRedirectPath = (userRole: string | undefined) => {
    if (userRole === 'admin') {
      return '/admin';
    }
    return '/dashboard';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // PRO: Call the context, not fetch/axios
      // login now returns the user object
      const loggedInUser = await login(formData.email, formData.password);

      // Redirect based on role: admin → /admin, user → /dashboard
      const redirectPath = getRedirectPath(loggedInUser.role);
      
      // PRO: Use navigate for SPA redirect, no hard reload
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      // The context re-threw the error
      const errorMessage =
        err?.response?.data?.error ||
        "Invalid email or password. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">{/* ... (Your Logo JSX) ... */}</div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white text-center mb-2">
              Welcome Back
            </h1>
            <p className="text-purple-200 text-center">
              Sign in to access your dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              {/* ... (Your Error JSX) ... */}
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  {/* ... (Spinner JSX) ... */}
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="relative my-6">
            {/* ... (Divider JSX "Or") ... */}
          </div>

          <div className="text-center">
            <p className="text-purple-200">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

       
      </div>
    </div>
  );
};

export default LoginPage;
