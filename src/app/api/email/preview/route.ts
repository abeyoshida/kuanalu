import { NextRequest, NextResponse } from 'next/server';
import { renderEmail } from '@/lib/email/render';
import { InvitationEmail } from '@/components/email/invitation-email';
import { TaskAssignmentEmail } from '@/components/email/task-assignment-email';
import React from 'react';

/**
 * API route handler for previewing emails in development
 * This is only available in development mode
 * 
 * @param request The incoming request
 * @returns The rendered email HTML
 */
export async function GET(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // Get email type from query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'invitation';
    
    // Render the appropriate email template
    let emailComponent;
    
    if (type === 'invitation') {
      const inviteeEmail = searchParams.get('email') || 'user@example.com';
      const organizationName = searchParams.get('org') || 'Example Organization';
      const inviterName = searchParams.get('inviter') || 'John Doe';
      const role = searchParams.get('role') || 'member';
      
      // Create a sample invitation URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const invitationToken = 'sample-token-for-preview';
      const invitationUrl = `${baseUrl}/invitations/accept?token=${invitationToken}`;
      
      // Set expiration date to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Render the invitation email
      emailComponent = React.createElement(InvitationEmail, {
        inviteeEmail,
        organizationName,
        inviterName,
        invitationUrl,
        role,
        expiresAt,
      });
    } else if (type === 'task-assignment') {
      emailComponent = React.createElement(TaskAssignmentEmail, {
        recipientEmail: 'user@example.com',
        recipientName: 'Jane Smith',
        assignerName: 'John Doe',
        taskTitle: 'Implement email notifications',
        taskId: 123,
        projectName: 'Kuanalu Email System',
        organizationName: 'Acme Inc.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        priority: 'high',
      });
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }
    
    // Render the email
    const emailHtml = await renderEmail(emailComponent);
    
    // Return the rendered HTML
    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating email preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate email preview' },
      { status: 500 }
    );
  }
} 