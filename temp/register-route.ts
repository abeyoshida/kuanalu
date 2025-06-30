import { db } from "@/lib/db";
import { users, organizations, organizationMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, name, email, password, organizationName } = await request.json();
    
    // Basic validation
    if (!name || !email || !password || !organizationName) {
      return NextResponse.json(
        { error: "Name, email, password, and organization name are required" },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    // For development/demo purposes, we're storing the password directly
    // In production, use a server action or API route with bcrypt
    const hashedPassword = password;
    
    // Create the organization slug from the name
    const organizationSlug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Start a transaction to ensure both user and organization are created
    return await db.transaction(async (tx) => {
      // Create the user
      const [newUser] = await tx
        .insert(users)
        .values({
          name,
          email,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: users.id });
      
      // Create the organization
      const [newOrg] = await tx
        .insert(organizations)
        .values({
          name: organizationName,
          slug: organizationSlug,
          visibility: 'private',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: organizations.id });
      
      // Add the user as owner of the organization
      await tx
        .insert(organizationMembers)
        .values({
          userId: newUser.id,
          organizationId: newOrg.id,
          role: 'owner',
          joinedAt: new Date(),
          createdAt: new Date(),
        });
      
      return NextResponse.json(
        { 
          message: "User and organization created successfully",
          userId: newUser.id,
          organizationId: newOrg.id
        },
        { status: 201 }
      );
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
} 