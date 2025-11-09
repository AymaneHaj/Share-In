// src/components/Sidebar/AdminSidebarTabs.tsx
import React, { useState } from "react";
import { Database, LayoutDashboard } from "lucide-react";
import { useLocation } from "react-router-dom";

interface AdminSidebarTabsProps {
  onNavigate?: () => void;
}

const AdminSidebarTabs: React.FC<AdminSidebarTabsProps> = ({ onNavigate }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"dashboard" | "data">("dashboard");

  const handleTabClick = (tab: "dashboard" | "data") => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <>
      <button
        onClick={() => handleTabClick("dashboard")}
        className={`group flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left w-full ${
          activeTab === "dashboard"
            ? "bg-cyan-50 text-cyan-700 border-l-4 border-cyan-600"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <LayoutDashboard className={`w-5 h-5 ${activeTab === "dashboard" ? "text-cyan-600" : "text-gray-500"}`} />
        <span className="text-sm">Dashboard</span>
      </button>
      <button
        onClick={() => handleTabClick("data")}
        className={`group flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left w-full ${
          activeTab === "data"
            ? "bg-cyan-50 text-cyan-700 border-l-4 border-cyan-600"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <Database className={`w-5 h-5 ${activeTab === "data" ? "text-cyan-600" : "text-gray-500"}`} />
        <span className="text-sm">Data</span>
      </button>
    </>
  );
};

export default AdminSidebarTabs;

