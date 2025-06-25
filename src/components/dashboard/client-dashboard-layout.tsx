"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User } from "lucide-react";
import ProjectSidebar from "@/components/project-sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppLayoutProps {
  children: React.ReactNode;
  userName: string;
  title?: string;
}

export default function AppLayout({ 
  children,
  userName,
  title = "Kanban Board"
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  
  // Check if we're on a project detail page
  const isProjectDetailPage = pathname.match(/^\/projects\/\d+$/);

  return (
    <>
      <ProjectSidebar isOpen={sidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <div className="p-4">
          {/* Header */}
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              {!isProjectDetailPage && <h1 className="text-3xl font-bold">{title}</h1>}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm">
                Welcome, <span className="font-medium">{userName}</span>
              </div>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Link href="/auth/logout">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Page Content */}
          {children}
        </div>
      </div>
    </>
  );
} 