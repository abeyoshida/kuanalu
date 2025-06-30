import { db } from "@/lib/db";
import { users, organizations, organizationMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createWithRelations } from "@/lib/db/sequential-ops";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, name, email, password, organizationName } = await request.json();
    
    // Basic validation
    if (!email || !password || !organizationName) {
      return NextResponse.json(
        { error: "Email, password, and organization name are required" },
        { status: 400 }
      );
    }
    
    // Use the provided name or combine firstName and lastName
    const fullName = name || `${firstName} ${lastName}`.trim();
    
    // Extract first and last name if not provided directly
    let extractedFirstName = firstName;
    let extractedLastName = lastName;
    
    if (!firstName && !lastName && fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      extractedFirstName = nameParts[0] || "";
      extractedLastName = nameParts.slice(1).join(" ") || "";
    }
    
    if (!fullName) {
      return NextResponse.json(
        { error: "Name is required" },
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
    
    // Use sequential operations instead of a transaction
    const result = await createWithRelations(
      // Create the user first
      async () => {
        const [newUser] = await db
          .insert(users)
          .values({
            name: fullName,
            firstName: extractedFirstName,
            lastName: extractedLastName,
            email,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning({ id: users.id });
        
        return newUser;
      },
      // Then create the organization and add the user as owner
      async (newUser) => {
        // Create the organization
        const [newOrg] = await db
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
        await db
          .insert(organizationMembers)
          .values({
            userId: newUser.id,
            organizationId: newOrg.id,
            role: 'owner',
            joinedAt: new Date(),
            createdAt: new Date(),
          });
        
        return newOrg;
      }
    );
    
    return NextResponse.json(
      { 
        message: "User and organization created successfully",
        userId: result.main.id,
        organizationId: result.related.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
} 