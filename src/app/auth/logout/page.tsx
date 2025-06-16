"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically sign out when the page loads
    const performLogout = async () => {
      await signOut();
      // Will redirect to login page in the signOut function
    };
    
    performLogout();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Signing Out</CardTitle>
          <CardDescription className="text-center">
            Please wait while we sign you out...
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => router.push("/auth/login")}
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 