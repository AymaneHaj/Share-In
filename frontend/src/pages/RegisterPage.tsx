// src/pages/RegisterPage.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Lock, Mail, User } from "lucide-react";

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    // username: "", // <-- REMOVED
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth(); // Get the "smart" register function
  const navigate = useNavigate();

  // Redirect based on role after registration
  const getRedirectPath = (userRole: string | undefined) => {
    if (userRole === 'admin') {
      return '/admin';
    }
    return '/dashboard';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(newFormData);
    
    // Clear general error
    if (error) setError("");
    
    // Validate field in real-time with updated form data
    const fieldError = validateField(name, value, newFormData);
    const newFieldErrors: typeof fieldErrors = {};
    
    // Copy existing errors (except for the current field)
    Object.keys(fieldErrors).forEach(key => {
      if (key !== name && fieldErrors[key as keyof typeof fieldErrors]) {
        newFieldErrors[key as keyof typeof fieldErrors] = fieldErrors[key as keyof typeof fieldErrors];
      }
    });
    
    // Add error for current field only if it exists
    if (fieldError) {
      newFieldErrors[name as keyof typeof fieldErrors] = fieldError;
    }
    
    // If password changed, re-validate confirmPassword
    if (name === "password" && newFormData.confirmPassword) {
      if (value !== newFormData.confirmPassword) {
        newFieldErrors.confirmPassword = "Passwords do not match";
      } else {
        // Remove the error if passwords now match
        delete newFieldErrors.confirmPassword;
      }
    }
    
    // If confirmPassword changed, validate it
    if (name === "confirmPassword" && newFormData.password) {
      if (value !== newFormData.password) {
        newFieldErrors.confirmPassword = "Passwords do not match";
      } else {
        // Remove the error if passwords now match
        delete newFieldErrors.confirmPassword;
      }
    }
    
    setFieldErrors(newFieldErrors);
  };
  
  const validateField = (name: string, value: string, currentFormData = formData): string | undefined => {
    if (!value.trim() && name !== "password" && name !== "confirmPassword") {
      return `${name === "confirmPassword" ? "Confirm Password" : name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }
    
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
      }
    }
    
    if (name === "password") {
      if (!value) {
        return "Password is required";
      }
      if (value.length < 6) {
        return "Password must be at least 6 characters";
      }
    }
    
    if (name === "confirmPassword") {
      if (!value) {
        return "Please confirm your password";
      }
      if (value !== currentFormData.password) {
        return "Passwords do not match";
      }
    }
    
    return undefined;
  };

  const validateForm = (): boolean => {
    // Check all required fields
    const errors: typeof fieldErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address";
      }
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setFieldErrors(errors);
    
    // Return true if no errors
    return Object.keys(errors).length === 0;
  };
  
  // Check if form is valid (for button disabled state)
  const isFormValid = (): boolean => {
    // Check if all required fields are filled
    const hasAllFields = 
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.password !== "" &&
      formData.confirmPassword !== "";
    
    // Check if email format is valid
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    
    // Check if password meets requirements
    const isPasswordValid = formData.password.length >= 6;
    
    // Check if passwords match
    const doPasswordsMatch = formData.password === formData.confirmPassword;
    
    // Check if there are any field errors (only count errors that are actual strings)
    const hasFieldErrors = Object.values(fieldErrors).some(error => error && error.trim() !== "");
    
    return hasAllFields && isEmailValid && isPasswordValid && doPasswordsMatch && !hasFieldErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      // PRO: Call the context, not fetch/axios
      // register now returns the user object
      // Note: register expects (username, email, password, name)
      // We use email as username since username field is removed
      const registeredUser = await register(
        formData.email, // Use email as username
        formData.email,
        formData.password,
        formData.name
      );

      // Redirect based on role: admin → /admin, user → /dashboard
      const redirectPath = getRedirectPath(registeredUser.role);
      
      // PRO: Use navigate for SPA redirect
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      let errorMessage = "Registration failed. Please try again.";
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as any).response === "object" &&
        (err as any).response !== null &&
        "data" in (err as any).response &&
        typeof (err as any).response.data === "object" &&
        (err as any).response.data !== null &&
        "error" in (err as any).response.data
      ) {
        errorMessage = (err as any).response.data.error;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center px-4 py-20">
      <div className="max-w-lg w-full">
        {/* ... (Your Logo JSX) ... */}

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white text-center mb-2">
              Create Your Account
            </h1>
            <p className="text-purple-200 text-center">
              Join us and start processing documents in seconds
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              {/* ... (Your Error JSX) ... */}
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... (Full Form JSX: Name, Email, Password, Confirm) ... */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-purple-300" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${
                    fieldErrors.name ? "border-red-500/50" : "border-white/20"
                  }`}
                  placeholder="e.g. Fatima Zahra"
                />
              </div>
              {fieldErrors.name && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* ... (Username input REMOVED) ... */}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-purple-300" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${
                    fieldErrors.email ? "border-red-500/50" : "border-white/20"
                  }`}
                  placeholder="e.g. fatimazahra@example.com"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-purple-300" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${
                    fieldErrors.password ? "border-red-500/50" : "border-white/20"
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-purple-300" />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${
                    fieldErrors.confirmPassword ? "border-red-500/50" : "border-white/20"
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Sign Up
                </>
              )}
            </button>
          </form>

          {/* ... (Rest of the JSX: Divider, "Already have an account?") ... */}
          <div className="text-center mt-6">
            <p className="text-purple-200">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
