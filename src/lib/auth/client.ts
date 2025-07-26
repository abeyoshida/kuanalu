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
    
    // If still authenticated, try aggressive cookie clearing
    const authStatus = await checkAuthStatus();
    if (authStatus.authenticated) {
      clearAuthCookies();
    }
    
    // Check if the response is successful
    if (response.ok) {
      // Clear any local storage items if you're using them
      localStorage.removeItem("user");
      sessionStorage.clear();
      
      // Try to use the NextAuth signOut endpoint directly
      try {
        await fetch("/api/auth/signout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ callbackUrl: "/auth/login" })
        });
      } catch {
        // Silently handle error - connection issues are ok
      }
      
      // Redirect to login page
      window.location.href = "/auth/login";
      return;
    }
    
    // If response was not ok, still try to redirect
    window.location.href = "/auth/login";
  } catch {
    // If there's an error, still try to redirect
    window.location.href = "/auth/login";
  }
}

// Function to check if user is still authenticated
export async function checkAuthStatus() {
  try {
    const res = await fetch("/api/auth/check", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      credentials: "include"
    });
    
    if (res.ok) {
      const data = await res.json();
      
      if (data.user) {
        return { authenticated: true, user: data.user };
      } else {
        return { authenticated: false };
      }
    } else {
      return { authenticated: false, error: await res.text() };
    }
  } catch (error) {
    return { authenticated: false, error };
  }
}

// Function to manually clear all auth cookies
export function clearAuthCookies() {
  // Get the domain
  const domain = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '' // No domain for localhost
    : window.location.hostname;
  
  const cookiesToClear = [
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.csrf-token',
    '__Secure-next-auth.callback-url',
    '__Host-next-auth.csrf-token',
    '__Host-next-auth.session-token',
    '__Host-next-auth.callback-url'
  ];
  
  // Try multiple domain variations
  const domainVariations = [
    domain, // Full domain (e.g., flowboardai.com)
    domain ? `.${domain}` : '', // Domain with leading dot (e.g., .flowboardai.com)
    domain.includes('.') ? domain.substring(domain.indexOf('.')) : '', // Root domain (e.g., .com)
    '' // No domain
  ];
  
  // Try multiple path variations
  const pathVariations = ['/', '', '/auth', '/api'];
  
  // Loop through all combinations of cookie names, domains, and paths
  cookiesToClear.forEach(cookieName => {
    domainVariations.forEach(domainVar => {
      pathVariations.forEach(path => {
        // Try with domain and path
        if (domainVar) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domainVar}; path=${path}; secure; samesite=lax`;
        }
        
        // Try without domain but with path
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; secure; samesite=lax`;
      });
    });
  });
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

 