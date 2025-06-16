import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export async function GET() {
  try {
    const session = await auth();
    
    // Return a proper JSON response with CORS headers
    return new NextResponse(
      JSON.stringify({
        user: session?.user || null,
        expires: session?.expires || null
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  } catch (error) {
    console.error("Session API error:", error);
    
    // Return a proper error response
    return new NextResponse(
      JSON.stringify({
        error: "Failed to get session"
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  }
} 