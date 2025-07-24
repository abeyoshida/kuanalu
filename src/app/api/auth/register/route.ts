import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, organizations, organizationMembers, invitations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Schema for validating registration input
const registerSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  organizationName: z.string().optional(),
  invitationToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errorMessage = result.error.errors.map(err => err.message).join(", ");
      return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }
    
    const { firstName, lastName, name, email, password, organizationName, invitationToken } = result.data;
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(results => results[0]);
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Handle invitation flow if token is provided
    if (invitationToken) {
      // Find the invitation
      const invitation = await db
        .select()
        .from(invitations)
        .where(eq(invitations.token, invitationToken))
        .limit(1)
        .then(results => results[0]);
      
      if (!invitation) {
        return NextResponse.json(
          { success: false, message: "Invalid invitation token" },
          { status: 400 }
        );
      }
      
      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: "Invitation email does not match the registration email" },
          { status: 400 }
        );
      }
      
      if (invitation.status !== "pending") {
        return NextResponse.json(
          { success: false, message: "Invitation has already been used or has expired" },
          { status: 400 }
        );
      }
      
      // Create the user
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          firstName,
          lastName,
          email,
          password: hashedPassword,
        })
        .returning();
      
      // Add user to the organization
      await db
        .insert(organizationMembers)
        .values({
          userId: newUser.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
        });
      
      // Update invitation status
      await db
        .update(invitations)
        .set({ status: "accepted" })
        .where(eq(invitations.id, invitation.id));
      
      return NextResponse.json({
        success: true,
        message: "User registered successfully",
        userId: newUser.id,
      });
    } 
    // Handle new organization creation
    else {
      // Create organization name from user's name if not provided
      const orgName = organizationName || `${name}'s Organization`;
      
      // Create the user first
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          firstName,
          lastName,
          email,
          password: hashedPassword,
        })
        .returning();
      
      // Create the organization
      const [newOrg] = await db
        .insert(organizations)
        .values({
          name: orgName,
          slug: orgName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        })
        .returning();
      
      // Add the user as owner of the organization
      await db
        .insert(organizationMembers)
        .values({
          userId: newUser.id,
          organizationId: newOrg.id,
          role: "owner",
        });
      
      return NextResponse.json({
        success: true,
        message: "User registered successfully",
        userId: newUser.id,
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Registration failed" 
      },
      { status: 500 }
    );
  }
} 