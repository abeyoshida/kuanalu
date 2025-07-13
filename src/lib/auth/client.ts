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

// Helper function to log all cookies
function logAllCookies() {
  console.log("🍪 Current cookies:");
  const cookies = document.cookie.split(';');
  
  if (cookies.length === 0 || (cookies.length === 1 && cookies[0] === '')) {
    console.log("   No cookies found");
    return;
  }
  
  cookies.forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    console.log(`   ${name}: ${value ? '(has value)' : '(empty)'}`);
  });
}

// Simple sign out function
export async function signOut() {
  console.log("🔄 Sign out process started");
  
  // Log cookies before logout
  console.log("📊 BEFORE logout:");
  logAllCookies();
  
  try {
    // First try to use the custom logout endpoint
    console.log("📤 Sending logout request to /api/auth/logout");
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include" // Important for including cookies
    });
    
    console.log(`📥 Logout response status: ${response.status}`);
    
    // Log cookies after server response
    console.log("📊 AFTER server response:");
    logAllCookies();
    
    // Check authentication status
    console.log("🔍 Checking if logout was successful...");
    const authStatus = await checkAuthStatus();
    
    // If still authenticated, try aggressive cookie clearing
    if (authStatus.authenticated) {
      console.log("⚠️ Still authenticated after API call, trying aggressive cookie clearing");
      clearAuthCookies();
      
      // Check authentication status again
      console.log("🔍 Checking auth status after aggressive cookie clearing...");
      const newAuthStatus = await checkAuthStatus();
      
      if (newAuthStatus.authenticated) {
        console.log("❌ Still authenticated after aggressive cookie clearing!");
      } else {
        console.log("✅ Successfully logged out after aggressive cookie clearing!");
      }
    }
    
    // Check if the response is successful
    if (response.ok) {
      console.log("✅ Logout API call successful");
      
      // Clear any local storage items if you're using them
      console.log("🧹 Clearing local storage");
      localStorage.removeItem("user");
      sessionStorage.clear();
      
      // Try to use the NextAuth signOut endpoint directly
      console.log("🔄 Trying NextAuth signOut endpoint directly");
      
      try {
        const signOutResponse = await fetch("/api/auth/signout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ callbackUrl: "/auth/login" })
        });
        
        console.log(`📥 NextAuth signOut response status: ${signOutResponse.status}`);
      } catch (e) {
        console.log("⚠️ NextAuth signOut endpoint failed:", e);
      }
      
      // DEBUGGING: Don't redirect automatically in development
      if (window.location.hostname === 'localhost' || 
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.includes('vercel.app')) {
        console.log("🔍 DEBUG MODE: Not redirecting automatically");
        console.log("⏱️ Wait 5 seconds to see logs...");
        
        // Add a delay to see logs before redirecting
        return new Promise<void>(resolve => {
          setTimeout(() => {
            console.log("⏱️ Delay complete, now you can manually redirect");
            console.log("🔀 To continue, run: window.location.href = '/auth/login'");
            resolve();
          }, 5000);
        });
      }
      
      // Force reload to ensure all state is cleared
      console.log("🔀 Redirecting to login page");
      window.location.href = "/auth/login";
      return;
    } else {
      const responseText = await response.text();
      console.error("❌ Logout failed:", responseText);
      console.log("⚠️ Response was not OK, status:", response.status);
      
      // DEBUGGING: Don't redirect automatically
      console.log("🔍 DEBUG MODE: Not redirecting automatically due to error");
      console.log("🔀 To continue, run: window.location.href = '/auth/logout'");
      
      // Don't redirect automatically when there's an error
      return;
    }
  } catch (error) {
    console.error("❌ Sign out error:", error);
    console.log("🔍 Error details:", JSON.stringify(error));
    
    // DEBUGGING: Don't redirect automatically
    console.log("🔍 DEBUG MODE: Not redirecting automatically due to error");
    console.log("🔀 To continue, run: window.location.href = '/auth/login'");
    
    // Don't redirect automatically when there's an error
    return;
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

// Function to directly test the logout API
export async function testLogoutAPI() {
  console.log("🧪 Testing logout API directly");
  
  // Log cookies before API call
  console.log("📊 BEFORE API call:");
  logAllCookies();
  
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include"
    });
    
    console.log(`📥 API test response status: ${response.status}`);
    
    try {
      const data = await response.json();
      console.log("📄 API response data:", data);
    } catch (e) {
      console.log("📄 Could not parse response as JSON:", await response.text());
    }
    
    // Log cookies after API call
    console.log("📊 AFTER API call:");
    logAllCookies();
    
    return response.ok;
  } catch (error) {
    console.error("❌ API test error:", error);
    return false;
  }
} 

// Function to check if user is still authenticated
export async function checkAuthStatus() {
  console.log("🔍 Checking authentication status...");
  try {
    const res = await fetch("/api/auth/check", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      credentials: "include"
    });

    console.log(`📥 Auth check response status: ${res.status}`);
    
    if (res.ok) {
      const data = await res.json();
      console.log("📄 Auth check response:", data);
      
      if (data.user) {
        console.log("🔴 Still authenticated! Logout failed!");
        return { authenticated: true, user: data.user };
      } else {
        console.log("🟢 Not authenticated. Logout succeeded!");
        return { authenticated: false };
      }
    } else {
      console.log("🟢 Not authenticated (error response). Logout likely succeeded!");
      return { authenticated: false, error: await res.text() };
    }
  } catch (error) {
    console.error("❌ Auth check error:", error);
    return { authenticated: false, error };
  }
} 

// Function to manually clear all auth cookies
export function clearAuthCookies() {
  console.log("🧹 Manually clearing auth cookies");
  
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
  
  console.log("🍪 Domain for cookies:", domain || "(no domain)");
  
  // Try multiple domain variations
  const domainVariations = [
    domain, // Full domain (e.g., flowboardai.com)
    domain ? `.${domain}` : '', // Domain with leading dot (e.g., .flowboardai.com)
    domain.includes('.') ? domain.substring(domain.indexOf('.')) : '', // Root domain (e.g., .com)
    '' // No domain
  ];
  
  // Try multiple path variations
  const pathVariations = ['/', '', '/auth', '/api'];
  
  // Try clearing with all combinations
  cookiesToClear.forEach(cookieName => {
    domainVariations.forEach(domainVar => {
      pathVariations.forEach(pathVar => {
        if (domainVar) {
          // With domain
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${pathVar}; domain=${domainVar};`;
          
          // With domain and secure
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${pathVar}; domain=${domainVar}; secure;`;
          
          // With domain, secure, and httpOnly (though this won't work from JS)
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${pathVar}; domain=${domainVar}; secure; httpOnly;`;
          
          // With domain, secure, httpOnly, and sameSite
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${pathVar}; domain=${domainVar}; secure; httpOnly; sameSite=lax;`;
        } else {
          // Without domain
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${pathVar};`;
          
          // Without domain but with secure
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${pathVar}; secure;`;
        }
      });
    });
  });
  
  console.log("✅ Cookies cleared manually");
  console.log("📊 Cookies after manual clearing:");
  logAllCookies();
} 