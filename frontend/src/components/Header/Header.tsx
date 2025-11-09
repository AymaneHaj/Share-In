// src/components/Header/Header.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Main Header Component
 * Responsive navigation header with authentication state
 */
const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-indigo-950/90 backdrop-blur-md shadow-lg shadow-purple-500/20"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50 group-hover:shadow-xl group-hover:shadow-purple-500/50 transition-all">
              <svg
                className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              DocuScan AI
            </span>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                {/* User role: show Dashboard link */}
                {user?.role === "user" && (
                  <Link
                    to="/dashboard"
                    className="hidden sm:block px-4 sm:px-6 py-2 text-white border border-purple-400/50 rounded-lg hover:bg-white/10 transition-all font-medium text-sm sm:text-base"
                  >
                    Dashboard
                  </Link>
                )}
                {/* Admin role: show Admin Dashboard link */}
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="hidden sm:block px-4 sm:px-6 py-2 text-white border border-cyan-400/50 rounded-lg hover:bg-white/10 transition-all font-medium text-sm sm:text-base"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/50 text-sm sm:text-base"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 sm:px-6 py-2 text-white border border-purple-400/50 rounded-lg hover:bg-white/10 transition-all font-medium text-sm sm:text-base"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-cyan-500/50 text-sm sm:text-base"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
