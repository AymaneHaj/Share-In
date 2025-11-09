// src/components/Header/DashboardHeader.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Menu, X } from "lucide-react";

interface DashboardHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (user?.role === 'admin') {
      return '/admin';
    }
    return '/dashboard';
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Left side - Menu button (mobile) + Logo */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Hamburger Menu Button - Mobile Only */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link to={getDashboardPath()} className="flex items-center gap-2 md:gap-3 group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-cyan-400 via-purple-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <svg
                className="w-4 h-4 md:w-6 md:h-6 text-white"
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
            <div className="hidden sm:block">
              <span className="text-base md:text-lg font-bold text-gray-900 block">
                DocuScan AI
              </span>
              <p className="text-xs text-gray-500 hidden md:block">Document Scanner</p>
            </div>
          </Link>
        </div>

        {/* Right side - User info */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* User info - Desktop */}
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-gray-900">{user?.name || user?.username}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          {/* Avatar */}
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shadow-lg">
            {user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

