"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>("An error occurred during authentication");

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "CredentialsSignin") {
      setErrorMessage("Invalid email or password");
    } else if (error) {
      setErrorMessage(`Authentication error: ${error}`);
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Authentication Error</h1>
          <div className="mt-4 p-4 bg-red-50 text-red-500 rounded-md">
            {errorMessage}
          </div>
          <div className="mt-6">
            <Button
              onClick={() => window.location.href = "/auth/login"}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 