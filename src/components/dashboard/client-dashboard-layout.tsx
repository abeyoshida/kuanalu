"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User } from "lucide-react";
import ProjectSidebar from "@/components/project-sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface AppLayoutProps {
  children: React.ReactNode;
  userName: string;
  title?: string;
  hideWelcomeMessage?: boolean;
}

export default function AppLayout({ 
  children,
  userName,
  title = "Kanban Board",
  hideWelcomeMessage = false
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        router.push("/auth/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <ProjectSidebar isOpen={sidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">{title}</h1>
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
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </>
  );
} 