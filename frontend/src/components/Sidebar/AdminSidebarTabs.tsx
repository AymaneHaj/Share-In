// src/components/Sidebar/AdminSidebarTabs.tsx
import React from "react";
import { LayoutDashboard, FileText } from "lucide-react";
import { useAdminTabs } from "../../contexts/AdminTabsContext";

interface AdminSidebarTabsProps {
  onNavigate?: () => void;
}

const AdminSidebarTabs: React.FC<AdminSidebarTabsProps> = ({ onNavigate }) => {
  const { activeTab, setActiveTab } = useAdminTabs();

  const handleTabClick = (tab: "dashboard" | "documents") => {
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
        onClick={() => handleTabClick("documents")}
        className={`group flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left w-full ${
          activeTab === "documents"
            ? "bg-cyan-50 text-cyan-700 border-l-4 border-cyan-600"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <FileText className={`w-5 h-5 ${activeTab === "documents" ? "text-cyan-600" : "text-gray-500"}`} />
        <span className="text-sm">Documents</span>
      </button>
    </>
  );
};

export default AdminSidebarTabs;

