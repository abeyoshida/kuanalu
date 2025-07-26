import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export async function POST() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    // Clear session by returning response that clears cookies
    const response = NextResponse.json({ message: "Logged out successfully" });
    
    // Clear the session token cookie
    response.cookies.set('next-auth.session-token', '', {
      expires: new Date(0),
      path: '/',
    });

    // Also clear the secure version for production
    response.cookies.set('__Secure-next-auth.session-token', '', {
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }
} 