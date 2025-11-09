// src/contexts/DashboardTabsContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

type TabType = "upload" | "documents";

interface DashboardTabsContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const DashboardTabsContext = createContext<DashboardTabsContextType | undefined>(undefined);

export const DashboardTabsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>("upload");

  return (
    <DashboardTabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </DashboardTabsContext.Provider>
  );
};

export const useDashboardTabs = () => {
  const context = useContext(DashboardTabsContext);
  if (context === undefined) {
    throw new Error("useDashboardTabs must be used within a DashboardTabsProvider");
  }
  return context;
};

