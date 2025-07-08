import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, organizations, organizationMembers, invitations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Schema for validating registration input
const registerSchema = z.object({
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
    
    const { name, email, password, organizationName, invitationToken } = result.data;
    
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
    
    // Start a transaction to ensure data consistency
    const result2 = await db.transaction(async (tx) => {
      // Create the user
      const [newUser] = await tx
        .insert(users)
        .values({
          name,
          email,
          password: hashedPassword,
        })
        .returning();
      
      // Handle invitation if token is provided
      if (invitationToken) {
        // Find the invitation
        const invitation = await tx
          .select()
          .from(invitations)
          .where(eq(invitations.token, invitationToken))
          .limit(1)
          .then(results => results[0]);
        
        if (!invitation) {
          throw new Error("Invalid invitation token");
        }
        
        if (invitation.email.toLowerCase() !== email.toLowerCase()) {
          throw new Error("Invitation email does not match the registration email");
        }
        
        if (invitation.status !== "pending") {
          throw new Error("Invitation has already been used or has expired");
        }
        
        // Add user to the organization
        await tx
          .insert(organizationMembers)
          .values({
            userId: newUser.id,
            organizationId: invitation.organizationId,
            role: invitation.role,
            invitedBy: invitation.invitedBy,
          });
        
        // Update invitation status
        await tx
          .update(invitations)
          .set({ status: "accepted" })
          .where(eq(invitations.id, invitation.id));
        
        return { user: newUser, organizationId: invitation.organizationId };
      } 
      // If no invitation, create a new organization for the user
      else {
        // Create organization name from user's name if not provided
        const orgName = organizationName || `${name}'s Organization`;
        
        // Create a new organization
        const [newOrg] = await tx
          .insert(organizations)
          .values({
            name: orgName,
            slug: orgName.toLowerCase().replace(/\s+/g, "-"),
          })
          .returning();
        
        // Add the user as owner of the organization
        await tx
          .insert(organizationMembers)
          .values({
            userId: newUser.id,
            organizationId: newOrg.id,
            role: "owner",
          });
        
        return { user: newUser, organizationId: newOrg.id };
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      userId: result2.user.id,
    });
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