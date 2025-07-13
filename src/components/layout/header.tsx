"use client";

import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, Bug, Shield, Trash, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHeader } from "./header-context";
import { signOut, testLogoutAPI, checkAuthStatus, clearAuthCookies } from "@/lib/auth/client";
import { useState } from "react";

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
  const [showDebug, setShowDebug] = useState(false);
  
  // Extract first name from the full name
  const firstName = userName.split(' ')[0];

  const handleLogout = async () => {
    console.log("%c🔘 Logout button clicked", "font-size: 16px; color: red; font-weight: bold;");
    console.log("%c⚠️ DEBUGGING MODE: Check console for logs", "font-size: 16px; color: red; font-weight: bold;");
    console.log("%c📝 After logout completes, you may need to manually redirect", "font-size: 14px; color: blue;");
    
    try {
      console.log("🔄 Calling signOut function");
      await signOut();
      console.log("✅ signOut function completed");
      console.log("%c📋 Logout process finished - check logs above", "font-size: 16px; color: green; font-weight: bold;");
    } catch (error) {
      console.error("❌ Header: Logout error:", error);
    }
  };

  const handleTestLogoutAPI = async () => {
    console.log("🧪 Test logout API button clicked");
    await testLogoutAPI();
  };
  
  const handleCheckAuthStatus = async () => {
    console.log("🔍 Checking auth status...");
    await checkAuthStatus();
  };
  
  const handleClearCookies = () => {
    console.log("🧹 Manually clearing cookies...");
    clearAuthCookies();
  };

  // Toggle debug mode with a secret key combination
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      setShowDebug(prev => !prev);
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10" onKeyDown={handleKeyDown} tabIndex={0}>
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
          
          {showDebug && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 bg-yellow-50"
                onClick={handleTestLogoutAPI}
              >
                <Bug className="h-4 w-4" />
                Test API
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 bg-green-50"
                onClick={handleCheckAuthStatus}
              >
                <Shield className="h-4 w-4" />
                Check Auth
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 bg-red-50"
                onClick={handleClearCookies}
              >
                <Trash className="h-4 w-4" />
                Clear Cookies
              </Button>
              <Link href="/auth/logout" target="_blank" rel="noopener noreferrer">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 bg-blue-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Logout Page
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 