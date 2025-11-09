// src/components/Header/DashboardTabs.tsx
import React from "react";
import { useDashboardTabs } from "../../contexts/DashboardTabsContext";
import { UploadCloud, FileText } from "lucide-react";

const DashboardTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useDashboardTabs();

  return (
    <div className="flex gap-1 sm:gap-2 bg-white/25 backdrop-blur-md rounded-lg sm:rounded-xl p-1 sm:p-1.5 border-2 border-white/40 shadow-xl w-full max-w-xs sm:max-w-none">
      <button
        onClick={() => setActiveTab("upload")}
        className={`flex-1 px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 ${
          activeTab === "upload"
            ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg scale-105"
            : "text-white hover:text-white hover:bg-white/25 bg-white/15"
        }`}
      >
        <span className="flex items-center justify-center gap-1 sm:gap-2">
          <UploadCloud className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="truncate">Téléverser</span>
        </span>
      </button>
      <button
        onClick={() => setActiveTab("documents")}
        className={`flex-1 px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 ${
          activeTab === "documents"
            ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg scale-105"
            : "text-white hover:text-white hover:bg-white/25 bg-white/15"
        }`}
      >
        <span className="flex items-center justify-center gap-1 sm:gap-2">
          <FileText className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="truncate">Documents</span>
        </span>
      </button>
    </div>
  );
};

export default DashboardTabs;

