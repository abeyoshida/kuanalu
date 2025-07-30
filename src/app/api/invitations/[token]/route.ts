import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invitations, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const params = await context.params;
    const { token } = params;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 400 }
      );
    }
    
    // Get the invitation
    const invitation = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1)
      .then(results => results[0]);
    
    if (!invitation) {
      return NextResponse.json(
        { success: false, message: 'Invitation not found' },
        { status: 404 }
      );
    }
    
    // Get organization details
    const organization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, invitation.organizationId))
      .limit(1)
      .then(results => results[0]);
    
    if (!organization) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Check if the invitation has expired
    const now = new Date();
    if (now > invitation.expiresAt) {
      // Update invitation status to expired if it's still pending
      if (invitation.status === 'pending') {
        await db
          .update(invitations)
          .set({ status: 'expired' })
          .where(eq(invitations.id, invitation.id));
          
        invitation.status = 'expired';
      }
    }
    
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        organizationId: invitation.organizationId,
        organization: {
          id: organization.id,
          name: organization.name,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
} 