"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Error caught by error boundary:", event.error);
      setHasError(true);
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="mb-6 text-gray-600">
          We&apos;re sorry, but there was an error loading this page.
        </p>
        <Button
          onClick={() => {
            setHasError(false);
            window.location.href = "/";
          }}
        >
          Go to homepage
        </Button>
      </div>
    );
  }

  return <>{children}</>;
} 