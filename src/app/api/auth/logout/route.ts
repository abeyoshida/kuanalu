import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth/auth";

export async function POST() {
  try {
    // Get domain for production
    const domain = process.env.COOKIE_DOMAIN || 
      (process.env.NODE_ENV === "production" 
        ? process.env.NEXTAUTH_URL 
          ? new URL(process.env.NEXTAUTH_URL).hostname 
          : undefined
        : undefined);
    
    // Create a response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });
    
    // Get the correct cookie name based on environment
    const sessionTokenName = process.env.NODE_ENV === "production" 
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";
    
    // Clear the session cookies by setting them with past expiry
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
      
    response.cookies.set(callbackUrlName, "", { 
      expires: new Date(0),
      path: "/",
      domain,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax"
    });
    
    // Also try clearing without domain specification
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
      response.cookies.set("__Host-next-auth.csrf-token", "", { 
        expires: new Date(0),
        path: "/",
        secure: true,
        httpOnly: true,
        sameSite: "lax"
      });
    }
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to log out" 
      },
      { status: 500 }
    );
  }
} 