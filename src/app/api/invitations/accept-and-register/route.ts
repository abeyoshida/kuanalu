import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invitations, users, organizationMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema for validating input
const acceptInvitationSchema = z.object({
  token: z.string().uuid(),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = acceptInvitationSchema.safeParse(body);
    if (!result.success) {
      const errorMessage = result.error.errors.map(err => err.message).join(', ');
      return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }
    
    const { token, name, email, password } = result.data;
    
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
    
    // Check if the invitation is for this email
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
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
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(results => results[0]);
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'A user with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }
    
    // Store the plain password for now to match the auth system
    const plainPassword = password;
    
    // Create user and accept invitation
    // Note: We're not using a transaction due to the Neon HTTP driver limitation
    
    // 1. Create the user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: plainPassword,
      })
      .returning();
    
    // 2. Add user to the organization
    await db
      .insert(organizationMembers)
      .values({
        userId: newUser.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
      });
    
    // 3. Update invitation status
    await db
      .update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.id, invitation.id));
    
    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      userId: newUser.id,
      organizationId: invitation.organizationId,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to accept invitation' },
      { status: 500 }
    );
  }
} 