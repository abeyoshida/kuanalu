"use client";

import { useSidebar } from "./sidebar-context";
import Sidebar from "./sidebar";
import Header from "./header";

interface AppShellProps {
  children: React.ReactNode;
  userName: string;
  title?: string;
}

export default function AppShell({ 
  children,
  userName,
  title = "Dashboard"
}: AppShellProps) {
  const { sidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main Content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Header */}
        <Header 
          userName={userName} 
          title={title} 
          toggleSidebar={toggleSidebar}
        />
        
        {/* Page Content */}
        <main className="flex-1 bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 