"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Automatically sign out after a short delay
    const timer = setTimeout(() => {
      signOut({ callbackUrl: "/" });
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleCancel = () => {
    router.back();
  };
  
  const handleLogoutNow = () => {
    signOut({ callbackUrl: "/" });
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign Out</CardTitle>
          <CardDescription className="text-center">
            You are being signed out of your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            <p className="text-sm text-gray-500">Signing out...</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleLogoutNow}>
            Sign Out Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 