import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth/auth";

export async function POST() {
  console.log("🔄 Server: Logout API route called");
  
  try {
    // Get domain for production
    const domain = process.env.COOKIE_DOMAIN || 
      (process.env.NODE_ENV === "production" 
        ? process.env.NEXTAUTH_URL 
          ? new URL(process.env.NEXTAUTH_URL).hostname 
          : undefined
        : undefined);
    
    console.log("🍪 Server: Using cookie domain:", domain || "default (no domain)");
    console.log("🌐 Server: NODE_ENV =", process.env.NODE_ENV);
    console.log("🔗 Server: NEXTAUTH_URL =", process.env.NEXTAUTH_URL);
    console.log("🔑 Server: COOKIE_DOMAIN =", process.env.COOKIE_DOMAIN);
    
    // Create a response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });
    
    // Get the correct cookie name based on environment
    const sessionTokenName = process.env.NODE_ENV === "production" 
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";
    
    console.log("🍪 Server: Using session token name:", sessionTokenName);
    
    // Clear the session cookies by setting them with past expiry
    console.log("🗑️ Server: Clearing session token cookie");
    response.cookies.set(sessionTokenName, "", { 
      expires: new Date(0),
      path: "/",
      domain,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax"
    });
    
    // Clear CSRF token
    const csrfTokenName = process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.csrf-token"
      : "next-auth.csrf-token";
      
    console.log("🗑️ Server: Clearing CSRF token cookie");
    response.cookies.set(csrfTokenName, "", { 
      expires: new Date(0),
      path: "/",
      domain,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax"
    });
    
    // Clear callback URL
    const callbackUrlName = process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.callback-url"
      : "next-auth.callback-url";
      
    console.log("🗑️ Server: Clearing callback URL cookie");
    response.cookies.set(callbackUrlName, "", { 
      expires: new Date(0),
      path: "/",
      domain,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax"
    });
    
    // Also try clearing without domain specification
    console.log("🗑️ Server: Clearing cookies without domain");
    response.cookies.set(sessionTokenName, "", { 
      expires: new Date(0),
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax"
    });
    
    response.cookies.set(csrfTokenName, "", { 
      expires: new Date(0),
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax"
    });
    
    response.cookies.set(callbackUrlName, "", { 
      expires: new Date(0),
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax"
    });
    
    // Try with __Host prefix as well (sometimes used in production)
    if (process.env.NODE_ENV === "production") {
      console.log("🗑️ Server: Clearing cookies with __Host prefix");
      response.cookies.set("__Host-next-auth.csrf-token", "", { 
        expires: new Date(0),
        path: "/",
        secure: true,
        httpOnly: true,
        sameSite: "lax"
      });
    }
    
    console.log("✅ Server: Logout completed successfully");
    return response;
  } catch (error) {
    console.error("❌ Server: Logout error:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to log out" 
      },
      { status: 500 }
    );
  }
} 