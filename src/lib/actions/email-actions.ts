import { createEmailNotification, getUnreadNotifications, markNotificationAsRead, addToQueue } from '@/lib/email/queue';
import { EmailNotificationType } from '@/lib/email/types';
import { InvitationEmail } from '@/components/email/invitation-email';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import React from 'react';
import { renderEmail, renderEmailText } from '@/lib/email/render';
import { sendTaskAssignmentEmail } from '@/lib/email/send-task-assignment';
import { sendTaskUpdateEmail } from '@/lib/email/send-task-update';
import { sendCommentEmail } from '@/lib/email/send-comment';

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
  metadata?: Record<string, unknown>;
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
 * @param organizationId The organization ID
 * @returns The created email queue item
 */
export async function sendInvitationEmailAction({
  inviteeEmail,
  organizationName,
  invitationToken,
  role,
  organizationId,
}: {
  inviteeEmail: string;
  organizationName: string;
  invitationToken: string;
  role: string;
  organizationId: number;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    const inviterName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || 'A user';
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const acceptUrl = `${baseUrl}/invitations/accept?token=${invitationToken}`;

    // Create the invitation email component
    const emailComponent = React.createElement(InvitationEmail, {
      inviteeEmail,
      organizationName,
      inviterName,
      acceptUrl,
      role,
    });

    // Render the email component to HTML and text
    const htmlContent = await renderEmail(emailComponent);
    const textContent = await renderEmailText(emailComponent);

    // Add the email to the queue and process immediately
    const result = await addToQueue({
      to: inviteeEmail,
      subject: `You've been invited to join ${organizationName}`,
      htmlContent,
      textContent,
      from: process.env.EMAIL_FROM || `FlowBoardAI <support@flowboardai.com>`,
      metadata: {
        invitationType: 'organization',
        organizationName,
        role,
        invitationToken,
      },
      userId: currentUser.id,
      organizationId,
      resourceType: 'invitation',
      processImmediately: true, // Process the email immediately
    });

    if (!result.success) {
      console.error('Failed to send invitation email:', result.error);
    } else if (result.emailId) {
      console.log(`Invitation email sent successfully with ID: ${result.emailId}`);
    } else {
      console.log('Invitation email queued successfully');
    }

    return result;
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
  data?: Record<string, unknown>;
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

/**
 * Send a task assignment email
 * 
 * @param recipientEmail The email address of the recipient
 * @param recipientName The name of the recipient
 * @param taskTitle The title of the task
 * @param taskId The ID of the task
 * @param projectName The name of the project
 * @param organizationName The name of the organization
 * @param dueDate Optional due date for the task
 * @param priority Optional priority of the task
 * @returns The created email queue item
 */
export async function sendTaskAssignmentEmailAction({
  recipientEmail,
  recipientName,
  taskTitle,
  taskId,
  projectName,
  organizationName,
  dueDate,
  priority,
}: {
  recipientEmail: string;
  recipientName: string;
  taskTitle: string;
  taskId: number;
  projectName: string;
  organizationName: string;
  dueDate?: Date;
  priority?: string;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    const assignerName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || 'A user';
    
    // Create the email component
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const taskUrl = `${baseUrl}/task/${taskId}`;

    // Render the email component to HTML and text
    const result = await sendTaskAssignmentEmail({
      recipientEmail,
      recipientName,
      assignerName,
      taskTitle,
      taskId,
      projectName,
      organizationName,
      dueDate,
      priority,
    });

    // Create a notification record
    if (result.success) {
      const recipientUser = await db
        .select()
        .from(users)
        .where(eq(users.email, recipientEmail))
        .limit(1);

      if (recipientUser.length > 0) {
        await createEmailNotification({
          type: EmailNotificationType.TASK_ASSIGNMENT,
          recipientId: recipientUser[0].id,
          senderId: currentUser.id,
          resourceType: 'task',
          resourceId: taskId,
          emailId: result.id,
          data: {
            taskTitle,
            projectName,
            organizationName,
            taskUrl,
            priority,
            dueDate: dueDate ? dueDate.toISOString() : null,
          },
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error sending task assignment email:', error);
    throw error;
  }
}

/**
 * Send a task update email
 * 
 * @param recipientEmail The email address of the recipient
 * @param recipientName The name of the recipient
 * @param taskTitle The title of the task
 * @param taskId The ID of the task
 * @param projectName The name of the project
 * @param organizationName The name of the organization
 * @param updateType The type of update (status, priority, dueDate, description, other)
 * @param oldValue Optional old value before the update
 * @param newValue Optional new value after the update
 * @returns The created email queue item
 */
export async function sendTaskUpdateEmailAction({
  recipientEmail,
  recipientName,
  taskTitle,
  taskId,
  projectName,
  organizationName,
  updateType,
  oldValue,
  newValue,
}: {
  recipientEmail: string;
  recipientName: string;
  taskTitle: string;
  taskId: number;
  projectName: string;
  organizationName: string;
  updateType: 'status' | 'priority' | 'dueDate' | 'description' | 'other';
  oldValue?: string;
  newValue?: string;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    const updaterName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || 'A user';
    
    // Create the email component
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const taskUrl = `${baseUrl}/task/${taskId}`;

    // Send the email
    const result = await sendTaskUpdateEmail({
      recipientEmail,
      recipientName,
      updaterName,
      taskTitle,
      taskId,
      projectName,
      organizationName,
      updateType,
      oldValue,
      newValue,
    });

    // Create a notification record
    if (result.success) {
      const recipientUser = await db
        .select()
        .from(users)
        .where(eq(users.email, recipientEmail))
        .limit(1);

      if (recipientUser.length > 0) {
        await createEmailNotification({
          type: EmailNotificationType.TASK_UPDATE,
          recipientId: recipientUser[0].id,
          senderId: currentUser.id,
          resourceType: 'task',
          resourceId: taskId,
          emailId: result.id,
          data: {
            taskTitle,
            projectName,
            organizationName,
            taskUrl,
            updateType,
            oldValue,
            newValue,
          },
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error sending task update email:', error);
    throw error;
  }
}

/**
 * Send a comment notification email
 * 
 * @param recipientEmail The email address of the recipient
 * @param recipientName The name of the recipient
 * @param taskTitle The title of the task
 * @param taskId The ID of the task
 * @param commentId The ID of the comment
 * @param commentContent The content of the comment
 * @param projectName The name of the project
 * @param organizationName The name of the organization
 * @param isMention Whether the notification is for a mention (true) or a comment (false)
 * @returns The created email queue item
 */
export async function sendCommentEmailAction({
  recipientEmail,
  recipientName,
  taskTitle,
  taskId,
  commentId,
  commentContent,
  projectName,
  organizationName,
  isMention = false,
}: {
  recipientEmail: string;
  recipientName: string;
  taskTitle: string;
  taskId: number;
  commentId: number;
  commentContent: string;
  projectName: string;
  organizationName: string;
  isMention?: boolean;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    const commenterName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || 'A user';
    
    // Create the email component
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const taskUrl = `${baseUrl}/task/${taskId}`;
    const commentUrl = `${baseUrl}/task/${taskId}?comment=${commentId}`;

    // Send the email
    const result = await sendCommentEmail({
      recipientEmail,
      recipientName,
      commenterName,
      taskTitle,
      taskId,
      commentId,
      commentContent,
      projectName,
      organizationName,
      isMention,
    });

    // Create a notification record
    if (result.success) {
      const recipientUser = await db
        .select()
        .from(users)
        .where(eq(users.email, recipientEmail))
        .limit(1);

      if (recipientUser.length > 0) {
        await createEmailNotification({
          type: isMention ? EmailNotificationType.MENTION : EmailNotificationType.COMMENT,
          recipientId: recipientUser[0].id,
          senderId: currentUser.id,
          resourceType: 'comment',
          resourceId: commentId,
          emailId: result.id,
          data: {
            taskTitle,
            taskId,
            projectName,
            organizationName,
            commentContent,
            taskUrl,
            commentUrl,
            isMention,
          },
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error sending comment email:', error);
    throw error;
  }
} 