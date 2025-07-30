import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invitations, organizationMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'You must be logged in to accept an invitation' },
        { status: 401 }
      );
    }
    
    // Get the token from the request body
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Invitation token is required' },
        { status: 400 }
      );
    }
    
    // Find the invitation
    const invitation = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1)
      .then(results => results[0]);
    
    if (!invitation) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }
    
    // Check if the invitation is for the authenticated user
    const userEmail = session.user.email || '';
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: 'This invitation is for a different email address' },
        { status: 403 }
      );
    }
    
    // Check if the invitation has already been used
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'This invitation has already been used or has expired' },
        { status: 400 }
      );
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
      .then(results => results[0] || null);
    
    if (existingMembership) {
      return NextResponse.json(
        { success: false, message: 'You are already a member of this organization' },
        { status: 400 }
      );
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
    
    console.log(`User ${session.user.email} accepted invitation and joined organization ${invitation.organizationId} with role ${invitation.role}`);
    
    // Revalidate paths to ensure fresh data is loaded
    revalidatePath('/organizations');
    revalidatePath(`/organizations/${invitation.organizationId}`);
    revalidatePath('/dashboard');
    
    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      organizationId: invitation.organizationId,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
} 