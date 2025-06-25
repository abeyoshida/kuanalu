"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const performLogout = async () => {
    try {
      await signOut();
      // The signOut function now handles the redirect
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Failed to sign out. Please try again.");
    }
  };

  useEffect(() => {
    // Automatically sign out when the page loads
    performLogout();
  }, []);

  const handleManualRedirect = () => {
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Signing Out</CardTitle>
          <CardDescription className="text-center">
            {error ? error : "Please wait while we sign you out..."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex justify-center py-8">
          {error ? (
            <Button onClick={performLogout}>Try Again</Button>
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={handleManualRedirect}
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 