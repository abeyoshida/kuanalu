import { queueEmail, createEmailNotification, getUnreadNotifications, markNotificationAsRead, addToQueue } from '@/lib/email/queue';
import { EmailOptions, EmailNotificationType } from '@/lib/email/types';
import { InvitationEmail } from '@/components/email/invitation-email';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import React from 'react';
import { renderEmail, renderEmailText } from '@/lib/email/render';

/**
 * Get the current user from the session
 * @returns The current user or null if not authenticated
 */
async function getCurrentUser() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return null;
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email));
    
    return user || null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Queue an email to be sent
 * 
 * @param options Email options
 * @param metadata Additional metadata about the email
 * @param userId Optional user ID who triggered the email
 * @param organizationId Optional organization ID
 * @param resourceType Optional resource type
 * @param resourceId Optional resource ID
 * @returns The created email queue item
 */
export async function queueEmailAction({
  options,
  metadata = {},
  userId,
  organizationId,
  resourceType,
  resourceId,
}: {
  options: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    react?: React.ReactNode;
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
  };
  metadata?: Record<string, any>;
  userId?: number;
  organizationId?: number;
  resourceType?: string;
  resourceId?: number;
}) {
  try {
    // If react is provided, render it to HTML and text
    let htmlContent = options.html;
    let textContent = options.text;

    if (options.react && !htmlContent) {
      const reactElement = options.react as React.ReactElement;
      htmlContent = await renderEmail(reactElement);
      if (!textContent) {
        textContent = await renderEmailText(reactElement);
      }
    }

    return await addToQueue({
      to: options.to,
      subject: options.subject,
      htmlContent: htmlContent || '',
      textContent: textContent,
      from: options.from,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      metadata,
      userId,
      organizationId,
      resourceType,
      resourceId,
    });
  } catch (error) {
    console.error('Error queueing email:', error);
    throw error;
  }
}

/**
 * Send an invitation email
 * 
 * @param inviteeEmail The email address of the invitee
 * @param organizationName The name of the organization
 * @param invitationToken The invitation token
 * @param role The role the invitee will have
 * @param expiresAt When the invitation expires
 * @param organizationId The organization ID
 * @returns The created email queue item
 */
export async function sendInvitationEmailAction({
  inviteeEmail,
  organizationName,
  invitationToken,
  role,
  expiresAt,
  organizationId,
}: {
  inviteeEmail: string;
  organizationName: string;
  invitationToken: string;
  role: string;
  expiresAt: Date;
  organizationId: number;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    const inviterName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || 'A user';
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/invitations/accept?token=${invitationToken}`;

    // Create the invitation email component
    const emailComponent = React.createElement(InvitationEmail, {
      inviteeEmail,
      organizationName,
      inviterName,
      invitationUrl,
      role,
      expiresAt,
    });

    // Render the email component to HTML and text
    const htmlContent = await renderEmail(emailComponent);
    const textContent = await renderEmailText(emailComponent);

    // Add the email to the queue
    return await addToQueue({
      to: inviteeEmail,
      subject: `You've been invited to join ${organizationName}`,
      htmlContent,
      textContent,
      from: `${process.env.EMAIL_FROM_NAME || 'Kuanalu'} <${process.env.EMAIL_FROM || 'noreply@example.com'}>`,
      metadata: {
        invitationType: 'organization',
        organizationName,
        role,
        invitationToken,
      },
      userId: currentUser.id,
      organizationId,
      resourceType: 'invitation',
    });
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
}

/**
 * Create an email notification
 * 
 * @param type Notification type
 * @param recipientId User ID who should receive the notification
 * @param data Additional data about the notification
 * @param senderId Optional user ID who triggered the notification
 * @param resourceType Optional resource type
 * @param resourceId Optional resource ID
 * @param emailId Optional email ID returned from email service
 * @returns The created notification
 */
export async function createNotificationAction({
  type,
  recipientId,
  data = {},
  senderId,
  resourceType,
  resourceId,
  emailId,
}: {
  type: EmailNotificationType;
  recipientId: number;
  data?: Record<string, any>;
  senderId?: number;
  resourceType?: string;
  resourceId?: number;
  emailId?: string;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    return await createEmailNotification({
      type,
      recipientId,
      data,
      senderId: senderId || currentUser.id,
      resourceType,
      resourceId,
      emailId,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get unread notifications for the current user
 * 
 * @param limit Maximum number of notifications to return
 * @returns Array of unread notifications
 */
export async function getUnreadNotificationsAction(limit = 10) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    return await getUnreadNotifications(currentUser.id, limit);
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 * 
 * @param id Notification ID
 * @returns The updated notification
 */
export async function markNotificationAsReadAction(id: number) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    return await markNotificationAsRead(id);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
} 