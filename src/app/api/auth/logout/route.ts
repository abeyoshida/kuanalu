import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Create a response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });
    
    // Get domain for production
    const domain = process.env.NODE_ENV === "production" 
      ? process.env.NEXTAUTH_URL 
        ? new URL(process.env.NEXTAUTH_URL).hostname 
        : undefined
      : undefined;
    
    // Clear the session cookies by setting them with past expiry
    response.cookies.set("next-auth.session-token", "", { 
      expires: new Date(0),
      path: "/",
      domain
    });
    
    response.cookies.set("next-auth.csrf-token", "", { 
      expires: new Date(0),
      path: "/",
      domain
    });
    
    response.cookies.set("next-auth.callback-url", "", { 
      expires: new Date(0),
      path: "/",
      domain
    });
    
    // Also clear any secure prefixed cookies (used in production)
    response.cookies.set("__Secure-next-auth.session-token", "", { 
      expires: new Date(0),
      path: "/",
      domain,
      secure: true
    });
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to log out" 
      },
      { status: 500 }
    );
  }
} 