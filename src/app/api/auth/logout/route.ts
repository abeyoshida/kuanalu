import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth/auth";

export async function POST() {
  try {
    await signOut();
    
    return NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });
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