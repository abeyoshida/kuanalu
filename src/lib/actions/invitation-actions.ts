'use server';

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { invitations, users, organizationMembers, organizations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/auth/permissions";
import { Role } from "@/lib/auth/client-permissions";
import { randomUUID } from "crypto";
import { sendInvitationEmailAction } from './email-actions';

interface InvitationResult {
  success: boolean;
  message: string;
}

/**
 * Server action to invite a user to an organization
 */
export async function inviteUserToOrganization(
  organizationId: number,
  email: string,
  role: Role
): Promise<InvitationResult> {
  try {
    console.log("Starting inviteUserToOrganization:", { organizationId, email, role });
    
    const session = await auth();
    console.log("Session:", session ? "exists" : "null");
    
    if (!session?.user) {
      console.log("No authenticated user found");
      return {
        success: false,
        message: "You must be logged in to invite users",
      };
    }
    
    const currentUserId = parseInt(session.user.id);
    console.log("Current user ID:", currentUserId);
    
    // Check if the current user has permission to invite users
    console.log("Checking permissions...");
    const canInviteUsers = await hasPermission(
      currentUserId,
      organizationId,
      'invite',
      'user'
    );
    console.log("Can invite users:", canInviteUsers);
    
    if (!canInviteUsers) {
      return {
        success: false,
        message: "You don't have permission to invite users to this organization",
      };
    }
    
    // Check if the email is valid
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: "Please provide a valid email address",
      };
    }
    
    // Check if the user is already a member of the organization
    console.log("Checking if user already exists...");
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    console.log("Existing user:", existingUser.length > 0 ? "found" : "not found");
    
    if (existingUser.length > 0) {
      const userId = existingUser[0].id;
      
      const existingMember = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.organizationId, organizationId)
          )
        )
        .limit(1);
      
      console.log("Existing member:", existingMember.length > 0 ? "found" : "not found");
      
      if (existingMember.length > 0) {
        return {
          success: false,
          message: "This user is already a member of the organization",
        };
      }
    }
    
    // Check if there's already a pending invitation for this email
    console.log("Checking for existing invitation...");
    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.organizationId, organizationId),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);
    
    console.log("Existing invitation:", existingInvitation.length > 0 ? "found" : "not found");
    
    if (existingInvitation.length > 0) {
      return {
        success: false,
        message: "An invitation has already been sent to this email address",
      };
    }
    
    // Create a new invitation
    console.log("Creating new invitation...");
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
    
    await db
      .insert(invitations)
      .values({
        token,
        email,
        organizationId,
        role,
        invitedBy: currentUserId,
        status: 'pending',
        expiresAt,
        createdAt: new Date(),
      });
    
    console.log("Invitation inserted into database");
    
    // Get organization details for the email
    console.log("Getting organization details...");
    const organization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)
      .then(results => results[0]);
    
    if (!organization) {
      throw new Error("Organization not found");
    }
    
    console.log("Organization found:", organization.name);
    
    // Send invitation email
    try {
      console.log("Sending invitation email...");
      await sendInvitationEmailAction({
        inviteeEmail: email,
        organizationName: organization.name,
        invitationToken: token,
        role: role,
        expiresAt: expiresAt,
        organizationId: organizationId,
      });
      
      console.log(`Invitation email queued for ${email}`);
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Continue with the invitation process even if email fails
      // The invitation is still created in the database
    }
    
    revalidatePath(`/organizations/${organizationId}`);
    
    console.log("Invitation process completed successfully");
    return {
      success: true,
      message: "Invitation sent successfully",
    };
  } catch (error) {
    console.error("Error sending invitation:", error);
    return {
      success: false,
      message: "Failed to send invitation",
    };
  }
}

/**
 * Server action to accept an invitation
 */
export async function acceptInvitation(token: string): Promise<InvitationResult> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return {
        success: false,
        message: "You must be logged in to accept an invitation",
      };
    }
    
    const currentUserId = parseInt(session.user.id);
    const currentUserEmail = session.user.email;
    
    // Find the invitation by token
    const invitation = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1)
      .then((results) => results[0]);
    
    if (!invitation) {
      return {
        success: false,
        message: "Invalid invitation token",
      };
    }
    
    // Check if the invitation is expired
    if (invitation.status !== 'pending') {
      return {
        success: false,
        message: `This invitation has already been ${invitation.status}`,
      };
    }
    
    const now = new Date();
    if (now > invitation.expiresAt) {
      // Update invitation status to expired
      await db
        .update(invitations)
        .set({ status: 'expired' })
        .where(eq(invitations.id, invitation.id));
      
      return {
        success: false,
        message: "This invitation has expired",
      };
    }
    
    // Check if the invitation is for the current user
    if (invitation.email !== currentUserEmail) {
      return {
        success: false,
        message: "This invitation is for a different email address",
      };
    }
    
    // Check if the user is already a member of the organization
    const existingMember = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, currentUserId),
          eq(organizationMembers.organizationId, invitation.organizationId)
        )
      )
      .limit(1);
    
    if (existingMember.length > 0) {
      // Update invitation status to accepted
      await db
        .update(invitations)
        .set({ status: 'accepted' })
        .where(eq(invitations.id, invitation.id));
      
      return {
        success: false,
        message: "You are already a member of this organization",
      };
    }
    
    // Add the user to the organization with the specified role
    await db
      .insert(organizationMembers)
      .values({
        userId: currentUserId,
        organizationId: invitation.organizationId,
        role: invitation.role,
        createdAt: new Date(),
      });
    
    // Update invitation status to accepted
    await db
      .update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.id, invitation.id));
    
    revalidatePath(`/organizations/${invitation.organizationId}`);
    
    return {
      success: true,
      message: "You have successfully joined the organization",
    };
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return {
      success: false,
      message: "Failed to accept invitation",
    };
  }
}

/**
 * Server action to get all pending invitations for a user
 */
export async function getUserPendingInvitations() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return [];
    }
    
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return [];
    }
    
    try {
      // Get all pending invitations for the user's email
      const pendingInvitations = await db
        .select({
          id: invitations.id,
          token: invitations.token,
          organizationId: invitations.organizationId,
          role: invitations.role,
          invitedBy: invitations.invitedBy,
          createdAt: invitations.createdAt,
          expiresAt: invitations.expiresAt,
          organizationName: organizations.name,
          inviterName: users.name,
        })
        .from(invitations)
        .innerJoin(
          organizations,
          eq(invitations.organizationId, organizations.id)
        )
        .innerJoin(
          users,
          eq(invitations.invitedBy, users.id)
        )
        .where(
          and(
            eq(invitations.email, userEmail),
            eq(invitations.status, 'pending')
          )
        );
      
      return pendingInvitations;
    } catch (error) {
      // Check if error is about missing table
      if (error instanceof Error && 
          error.message.includes("relation \"invitations\" does not exist")) {
        // Table doesn't exist yet, return empty array
        console.log("Invitations table doesn't exist yet");
        return [];
      }
      // Re-throw other errors
      throw error;
    }
  } catch (error) {
    console.error("Error getting user invitations:", error);
    return [];
  }
} 