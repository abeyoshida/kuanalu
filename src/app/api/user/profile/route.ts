import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = parseInt(session.user.id);
    
    // Parse request body
    const { name, email, bio } = await request.json();
    
    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }
    
    // Check if email is already taken by another user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 409 }
      );
    }
    
    // Update user profile
    const updatedUser = await db
      .update(users)
      .set({
        name,
        email,
        bio,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    // Return updated user without password
    const { password: _, ...userWithoutPassword } = updatedUser[0];
    
    return NextResponse.json(
      { message: "Profile updated successfully", user: userWithoutPassword },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 