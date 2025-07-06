import { NextRequest, NextResponse } from 'next/server';
import { renderEmail } from '@/lib/email/render';
import { InvitationEmail } from '@/components/email/invitation-email';
import { TaskAssignmentEmail } from '@/components/email/task-assignment-email';
import { TaskUpdateEmail } from '@/components/email/task-update-email';
import { CommentEmail } from '@/components/email/comment-email';
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
    } else if (type === 'task-update') {
      // Get update type from query params
      const updateType = searchParams.get('updateType') || 'status';
      
      // Create appropriate props based on update type
      const updateProps: {
        recipientEmail: string;
        recipientName: string;
        updaterName: string;
        taskTitle: string;
        taskId: number;
        projectName: string;
        organizationName: string;
        updateType: 'status' | 'priority' | 'dueDate' | 'description' | 'other';
        oldValue?: string;
        newValue?: string;
      } = {
        recipientEmail: 'user@example.com',
        recipientName: 'Jane Smith',
        updaterName: 'John Doe',
        taskTitle: 'Implement email notifications',
        taskId: 123,
        projectName: 'Kuanalu Email System',
        organizationName: 'Acme Inc.',
        updateType: updateType as 'status' | 'priority' | 'dueDate' | 'description' | 'other',
      };
      
      // Add appropriate old/new values based on update type
      if (updateType === 'status') {
        updateProps.oldValue = 'todo';
        updateProps.newValue = 'in_progress';
      } else if (updateType === 'priority') {
        updateProps.oldValue = 'medium';
        updateProps.newValue = 'high';
      } else if (updateType === 'dueDate') {
        updateProps.oldValue = new Date().toISOString();
        updateProps.newValue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
      
      emailComponent = React.createElement(TaskUpdateEmail, updateProps);
    } else if (type === 'comment') {
      // Check if it's a mention notification
      const isMention = searchParams.get('mention') === 'true';
      
      emailComponent = React.createElement(CommentEmail, {
        recipientEmail: 'user@example.com',
        recipientName: 'Jane Smith',
        commenterName: 'John Doe',
        taskTitle: 'Implement email notifications',
        taskId: 123,
        commentId: 456,
        commentContent: isMention 
          ? 'Hey @Jane, could you review the email templates I\'ve created? I want to make sure they follow our design guidelines.'
          : 'I\'ve made some progress on this task. The email templates are now working correctly, but we still need to integrate them with the task update flow.',
        projectName: 'Kuanalu Email System',
        organizationName: 'Acme Inc.',
        isMention,
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