// src/layouts/MainLayout.tsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import DashboardHeader from "../components/Header/DashboardHeader";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Main Layout for the authenticated Dashboard area.
 * MongoDB-style layout: Full-width header at top, full-height sidebar on left
 * Responsive: Sidebar hidden on mobile, shown via hamburger menu
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  const isAdmin = location.pathname === "/admin";
  const showSidebar = isDashboard || isAdmin;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Sidebar - Full height from top to bottom */}
      {showSidebar && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      
      {/* Main Content Area */}
      <div className={`flex flex-col flex-grow ${showSidebar ? 'md:ml-64' : ''}`}>
        {/* Header - Full width at top */}
        {showSidebar && (
          <DashboardHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        )}
        
        {/* Main Content */}
        <main className={`flex-grow overflow-x-hidden bg-gray-50 ${showSidebar ? 'pt-14 md:pt-16' : ''}`}>
          <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
