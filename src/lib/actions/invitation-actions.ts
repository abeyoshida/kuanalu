'use server';

import { db } from '@/lib/db';
import { invitations, organizations, users, organizationMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { hasPermission } from '@/lib/auth/server-permissions';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
import { sendInvitationEmail } from '@/lib/email/send-invitation';
import { roleEnum } from '@/lib/db/schema';

export async function inviteUserToOrganization(
  organizationId: number,
  email: string,
  role: string
) {
  try {
    // Get the current user's session
    const session = await auth();
    
    if (!session?.user) {
      return { success: false, message: "You must be logged in to invite users" };
    }
    
    // Check if the current user has permission to invite users to this organization
    const canInvite = await hasPermission(
      Number(session.user.id),
      organizationId,
      'invite',
      'user'
    );
    
    if (!canInvite) {
      return { success: false, message: "You don't have permission to invite users to this organization" };
    }
    
    // Check if the user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(results => results[0] || null);
    
    // If the user exists, check if they are already a member of the organization
    if (existingUser) {
      const existingMember = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, existingUser.id),
            eq(organizationMembers.organizationId, organizationId)
          )
        )
        .limit(1)
        .then(results => results[0] || null);
      
      if (existingMember) {
        return { success: false, message: "This user is already a member of the organization" };
      }
    }
    
    // Check if an invitation has already been sent to this email for this organization
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
      .limit(1)
      .then(results => results[0] || null);
    
    if (existingInvitation) {
      return { success: false, message: "An invitation has already been sent to this email address" };
    }
    
    // Create a new invitation
    const token = uuidv4();
    const expiresAt = addDays(new Date(), 7); // Invitation expires in 7 days
    
    await db
      .insert(invitations)
      .values({
        email,
        organizationId,
        role: role as typeof roleEnum.enumValues[number], // Use proper type
        invitedBy: Number(session.user.id),
        status: 'pending',
        expiresAt,
        token, // Add token field
      })
      .returning();
    
    // Get organization details for the email
    const organization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)
      .then(results => results[0]);
    
    if (!organization) {
      return { success: false, message: "Organization not found" };
    }
    
    // Send invitation email
    const emailResult = await sendInvitationEmail({
      inviteeEmail: email,
      organizationName: organization.name,
      inviterName: session.user.name || 'Someone',
      invitationToken: token,
      role,
    });
    
    return { success: true, message: "Invitation sent successfully" };
  } catch (error) {
    console.error('Error inviting user:', error);
    return { success: false, message: "Failed to send invitation" };
  }
}

export async function acceptInvitation(token: string) {
  try {
    // Get the current user's session
    const session = await auth();
    
    if (!session?.user) {
      return { success: false, message: "You must be logged in to accept an invitation" };
    }
    
    // Find the invitation
    const invitation = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1)
      .then(results => results[0]);
    
    if (!invitation) {
      return { success: false, message: "Invalid invitation token" };
    }
    
    // Check if the invitation is for the current user
    if (invitation.email !== session.user.email) {
      return { success: false, message: "This invitation is for a different email address" };
    }
    
    // Check if the invitation has already been used
    if (invitation.status !== 'pending') {
      return { success: false, message: "This invitation has already been used or has expired" };
    }
    
    // Check if the user is already a member of the organization
    const existingMembership = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, Number(session.user.id)),
          eq(organizationMembers.organizationId, invitation.organizationId)
        )
      )
      .limit(1)
      .then(results => results[0]);
    
    if (existingMembership) {
      return { success: false, message: "You are already a member of this organization" };
    }
    
    // Add the user to the organization
    await db
      .insert(organizationMembers)
      .values({
        userId: Number(session.user.id),
        organizationId: invitation.organizationId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
      });
    
    // Update the invitation status
    await db
      .update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.id, invitation.id));
    
    return { success: true, message: "Invitation accepted successfully" };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { success: false, message: "Failed to accept invitation" };
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