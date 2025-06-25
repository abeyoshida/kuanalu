import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Create a response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });
    
    // Clear the session cookies by setting them with past expiry
    response.cookies.set("next-auth.session-token", "", { 
      expires: new Date(0),
      path: "/"
    });
    
    response.cookies.set("next-auth.csrf-token", "", { 
      expires: new Date(0),
      path: "/"
    });
    
    response.cookies.set("next-auth.callback-url", "", { 
      expires: new Date(0),
      path: "/"
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