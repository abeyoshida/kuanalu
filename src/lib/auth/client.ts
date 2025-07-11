"use client";

import { useState, useEffect } from "react";

// Define session types
interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

interface Session {
  user: User | null;
  expires: string | null;
}

// Custom hook to get session data
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        // Use a direct fetch to our custom session endpoint
        const res = await fetch("/api/auth/check", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch session");
        }

        const data = await res.json();
        setSession({
          user: data.user,
          expires: data.timestamp,
        });
      } catch (err) {
        console.error("Error fetching session:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setSession(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, []);

  return {
    data: session,
    status: loading ? "loading" : session?.user ? "authenticated" : "unauthenticated",
    loading,
    error,
  };
}

// Simple sign out function
export async function signOut() {
  try {
    // First try to use the custom logout endpoint
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include" // Important for including cookies
    });
    
    // Check if the response is successful
    if (response.ok) {
      // Clear any local storage items if you're using them
      localStorage.removeItem("user");
      sessionStorage.clear();
      
      // Force reload to ensure all state is cleared
      window.location.href = "/auth/login";
      return;
    } else {
      console.error("Logout failed:", await response.text());
      
      // Fallback: If the API route fails, try to redirect to the logout page
      window.location.href = "/auth/logout";
    }
  } catch (error) {
    console.error("Sign out error:", error);
    // If all else fails, redirect to login
    window.location.href = "/auth/login";
  }
}

// Simple sign in function
export async function signIn(credentials: { email: string; password: string }) {
  try {
    const res = await fetch("/api/auth/verify-credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      throw new Error("Authentication failed");
    }

    const data = await res.json();
    return { success: data.success, user: data.user };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "Authentication failed" };
  }
} 