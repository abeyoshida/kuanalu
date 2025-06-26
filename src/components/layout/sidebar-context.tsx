"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: ReactNode;
  defaultOpen?: boolean;
}

export function SidebarProvider({ 
  children, 
  defaultOpen = true 
}: SidebarProviderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultOpen);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const value = {
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
} 