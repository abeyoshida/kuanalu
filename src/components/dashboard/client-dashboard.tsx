"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogOut, User, Menu } from "lucide-react";
import KanbanBoard from "@/components/kanban-board";
import ProjectSidebar from "@/components/project-sidebar";

interface ClientDashboardProps {
  userName: string;
}

export default function ClientDashboard({ userName }: ClientDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <ProjectSidebar isOpen={sidebarOpen} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold">Kanban Board</h1>
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
          
          {/* Kanban Board */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <KanbanBoard />
          </div>
        </div>
      </div>
    </>
  );
} 