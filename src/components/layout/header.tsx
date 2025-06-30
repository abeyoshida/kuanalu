"use client";

import { Button } from "@/components/ui/button";
import { Menu, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHeader } from "./header-context";

interface HeaderProps {
  userName: string;
  toggleSidebar: () => void;
}

export default function Header({ 
  userName,
  toggleSidebar
}: HeaderProps) {
  const router = useRouter();
  const { title, entityName } = useHeader();
  
  // Extract first name from the full name
  const firstName = userName.split(' ')[0];

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
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{entityName || title}</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm">
            Welcome, <span className="font-medium">{firstName}</span>
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
  );
} 