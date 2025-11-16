// src/contexts/AdminTabsContext.tsx
import React, { createContext, useContext, useState, type ReactNode } from "react";

type TabType = "dashboard" | "documents";

interface AdminTabsContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const AdminTabsContext = createContext<AdminTabsContextType | undefined>(undefined);

export const AdminTabsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  return (
    <AdminTabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </AdminTabsContext.Provider>
  );
};

export const useAdminTabs = () => {
  const context = useContext(AdminTabsContext);
  if (context === undefined) {
    throw new Error("useAdminTabs must be used within a AdminTabsProvider");
  }
  return context;
};

