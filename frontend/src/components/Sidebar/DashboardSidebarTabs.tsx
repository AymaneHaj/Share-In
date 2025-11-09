// src/components/Sidebar/DashboardSidebarTabs.tsx
import React from "react";
import { useDashboardTabs } from "../../contexts/DashboardTabsContext";
import { UploadCloud, FileText } from "lucide-react";

interface DashboardSidebarTabsProps {
  onNavigate?: () => void;
}

const DashboardSidebarTabs: React.FC<DashboardSidebarTabsProps> = ({ onNavigate }) => {
  const { activeTab, setActiveTab } = useDashboardTabs();

  const handleTabClick = (tab: "upload" | "documents") => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <>
      <button
        onClick={() => handleTabClick("upload")}
        className={`group flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left w-full ${
          activeTab === "upload"
            ? "bg-cyan-50 text-cyan-700 border-l-4 border-cyan-600"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <UploadCloud className={`w-5 h-5 ${activeTab === "upload" ? "text-cyan-600" : "text-gray-500"}`} />
        <span className="text-sm">Téléverser</span>
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
        <span className="text-sm">Mes Documents</span>
      </button>
    </>
  );
};

export default DashboardSidebarTabs;

