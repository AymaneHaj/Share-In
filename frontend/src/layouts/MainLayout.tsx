// src/layouts/MainLayout.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Header for the authenticated dashboard area.
 * It's different from the public 'Header' component.
 */
const DashboardHeader: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <svg
                className="w-6 h-6 text-white"
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
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              DocuScan AI
            </span>
          </Link>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <span className="text-slate-600 hidden sm:block">
              Welcome, <strong>{user?.name || user?.username}</strong>
            </span>
            <button
              onClick={logout}
              className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-500/30"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

/**
 * Main Layout for the authenticated Dashboard area.
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden">
      <DashboardHeader />
      <main className="flex-grow overflow-x-hidden">{children}</main>
    </div>
  );
};

export default MainLayout;
