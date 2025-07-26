"use client";

import { Button } from "@/components/ui/button";
import { LogOut, User, Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useHeader } from "./header-context";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  toggleSidebar?: () => void;
}

export default function Header({ user, toggleSidebar }: HeaderProps) {
  const { title, entityName } = useHeader();
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  // Extract first name from the full name for a cleaner display
  const firstName = user.name?.split(' ')[0] || 'User';

  // Display the title with entity name if available
  const displayTitle = entityName ? `${title} - ${entityName}` : title;

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          {toggleSidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="flex items-center justify-center p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">
              {displayTitle}
            </h1>
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
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
} 