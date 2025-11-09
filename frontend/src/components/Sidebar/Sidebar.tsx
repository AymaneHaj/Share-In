// src/components/Sidebar/Sidebar.tsx
import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import DashboardSidebarTabs from "./DashboardSidebarTabs";
import AdminSidebarTabs from "./AdminSidebarTabs";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  const isAdmin = location.pathname === "/admin";
  const { user, logout } = useAuth();

  if (!isDashboard && !isAdmin) {
    return null;
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-14 md:top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Menu Section */}
          <div className="flex-1 overflow-y-auto p-4 pt-4 md:pt-6">
            <nav className="flex flex-col gap-1">
              {isDashboard && <DashboardSidebarTabs onNavigate={onClose} />}
              {isAdmin && <AdminSidebarTabs onNavigate={onClose} />}
            </nav>
          </div>

          {/* User Section at Bottom */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || user?.username}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold transition-all duration-300 border border-red-200 hover:border-red-300"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

