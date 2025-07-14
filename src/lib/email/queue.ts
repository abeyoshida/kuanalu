import { db } from '@/lib/db';
import { emailQueue, emailNotifications } from '@/lib/db/schema';
import { EmailOptions, EmailNotificationType } from './types';
import { renderEmail, renderEmailText } from './render';
import { eq, and, or, lte } from 'drizzle-orm';
import { sendEmail } from './client';
import React from 'react';
import { sql } from 'drizzle-orm';

/**
 * Add an email to the queue
 * 
 * @param options Email options
 * @param metadata Additional metadata about the email
 * @param userId Optional user ID who triggered the email
 * @param organizationId Optional organization ID
 * @param resourceType Optional resource type
 * @param resourceId Optional resource ID
 * @returns The created email queue item
 */
export async function queueEmail({
  options,
  metadata = {},
  userId,
  organizationId,
  resourceType,
  resourceId,
}: {
  options: EmailOptions;
  metadata?: Record<string, unknown>;
  userId?: number;
  organizationId?: number;
  resourceType?: string;
  resourceId?: number;
}): Promise<unknown> {
  try {
    // Ensure react is a React element
    const reactElement = options.react as React.ReactElement;
    
    // Render email content
    const htmlContent = await renderEmail(reactElement);
    const textContent = await renderEmailText(reactElement);

    // Convert arrays to JSON strings for storage
    const to = Array.isArray(options.to) ? JSON.stringify(options.to) : options.to;
    const cc = options.cc ? (Array.isArray(options.cc) ? JSON.stringify(options.cc) : options.cc) : null;
    const bcc = options.bcc ? (Array.isArray(options.bcc) ? JSON.stringify(options.bcc) : options.bcc) : null;

    // Insert into queue
    const [queueItem] = await db.insert(emailQueue).values({
      to,
      subject: options.subject,
      htmlContent,
      textContent,
      from: options.from || process.env.EMAIL_FROM || `FlowBoardAI <support@flowboardai.com>`,
      cc,
      bcc,
      replyTo: options.replyTo,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      metadata: metadata as unknown,
      userId,
      organizationId,
      resourceType,
      resourceId,
    }).returning();

    return queueItem;
  } catch (error) {
    console.error('Error queueing email:', error);
    throw error;
  }
}

/**
 * Process the email queue (legacy function for backward compatibility)
 */
export async function processEmailQueue(limit = 10): Promise<number> {
  try {
    const result = await processQueue({ limit });
    return result.processed;
  } catch (error) {
    console.error('Error in processEmailQueue:', error);
    return 0;
  }
}

/**
 * Create an email notification record
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
export async function createEmailNotification({
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
    const [notification] = await db.insert(emailNotifications).values({
      type,
      recipientId,
      senderId,
      resourceType,
      resourceId,
      emailId,
      read: false,
      data: data as unknown,
    }).returning();

    return notification;
  } catch (error) {
    console.error('Error creating email notification:', error);
    throw error;
  }
}

/**
 * Mark an email notification as read
 * 
 * @param id Notification ID
 * @returns The updated notification
 */
export async function markNotificationAsRead(id: number) {
  try {
    const [notification] = await db.update(emailNotifications)
      .set({ read: true })
      .where(eq(emailNotifications.id, id))
      .returning();

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Get unread notifications for a user
 * 
 * @param userId User ID
 * @param limit Maximum number of notifications to return
 * @returns Array of unread notifications
 */
export async function getUnreadNotifications(userId: number, limit = 10) {
  try {
    return await db
      .select()
      .from(emailNotifications)
      .where(
        and(
          eq(emailNotifications.recipientId, userId),
          eq(emailNotifications.read, false)
        ))
      .orderBy(sql`${emailNotifications.createdAt} DESC`)
      .limit(limit);
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    throw error;
  }
}

/**
 * Add an email to the queue for later processing
 */
export async function addToQueue(options: {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  metadata?: Record<string, unknown>;
  userId?: number;
  organizationId?: number;
  resourceType?: string;
  resourceId?: number;
  processImmediately?: boolean;
}): Promise<{ success: boolean; id?: number; emailId?: string; error?: string }> {
  try {
    console.log('[DEBUG] addToQueue called with options:', {
      to: options.to,
      subject: options.subject,
      from: options.from || process.env.EMAIL_FROM,
      processImmediately: options.processImmediately
    });
    
    // Convert arrays to strings for storage
    const to = Array.isArray(options.to) ? options.to.join(',') : options.to;
    const cc = Array.isArray(options.cc) ? options.cc.join(',') : options.cc;
    const bcc = Array.isArray(options.bcc) ? options.bcc.join(',') : options.bcc;

    // Add the email to the queue
    const [result] = await db.insert(emailQueue).values({
      to,
      subject: options.subject,
      htmlContent: options.htmlContent,
      textContent: options.textContent,
      from: options.from || process.env.EMAIL_FROM || `FlowBoardAI <support@flowboardai.com>`,
      cc,
      bcc,
      replyTo: options.replyTo,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      metadata: options.metadata || {},
      userId: options.userId,
      organizationId: options.organizationId,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({ id: emailQueue.id });

    console.log('[DEBUG] Email added to queue with ID:', result.id);

    // Process the email immediately if requested
    if (options.processImmediately) {
      console.log('[DEBUG] Processing email immediately');
      try {
        // Process just this email
        const queueItem = await db.select().from(emailQueue).where(eq(emailQueue.id, result.id)).limit(1);
        
        if (queueItem.length > 0) {
          const email = queueItem[0];
          console.log('[DEBUG] Found queue item to process immediately:', email.id);
          const processResult = await processQueueItem(email);
          
          if (processResult.success) {
            console.log('[DEBUG] Email processed successfully with ID:', processResult.emailId);
            return { 
              success: true, 
              id: result.id, 
              emailId: processResult.emailId 
            };
          } else {
            console.error('[DEBUG] Failed to process email immediately:', processResult.error);
            return { 
              success: false, 
              id: result.id, 
              error: processResult.error 
            };
          }
        } else {
          console.error('[DEBUG] Could not find queue item to process immediately');
        }
      } catch (processError) {
        console.error('[DEBUG] Error processing email immediately:', processError);
        // Continue even if immediate processing fails - the email is still in the queue
      }
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error('[DEBUG] Error adding email to queue:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Process a single email queue item
 */
async function processQueueItem(email: typeof emailQueue.$inferSelect): Promise<{ 
  success: boolean; 
  emailId?: string; 
  error?: string 
}> {
  try {
    console.log('[DEBUG] Processing queue item:', email.id);
    
    // Convert comma-separated strings back to arrays if needed
    const to = email.to.includes(',') ? email.to.split(',') : email.to;
    const cc = email.cc?.includes(',') ? email.cc.split(',') : email.cc;
    const bcc = email.bcc?.includes(',') ? email.bcc.split(',') : email.bcc;
    
    console.log('[DEBUG] Sending email with from:', email.from);
    
    // Send the email
    const result = await sendEmail({
      from: email.from,
      to,
      subject: email.subject,
      html: email.htmlContent,
      text: email.textContent || undefined,
      cc: cc || undefined,
      bcc: bcc || undefined,
      replyTo: email.replyTo || undefined,
      queueId: email.id
    });
    
    if (result.error) {
      console.error('[DEBUG] Email sending failed:', result.error);
      
      // Email failed to send, update the queue record
      const attempts = email.attempts + 1;
      const maxAttempts = email.maxAttempts || 3;
      
      if (attempts >= maxAttempts) {
        // Max attempts reached, mark as failed
        console.log('[DEBUG] Max attempts reached, marking as failed');
        await db.update(emailQueue)
          .set({
            status: 'failed',
            attempts,
            error: result.error,
            updatedAt: new Date(),
          })
          .where(eq(emailQueue.id, email.id));
      } else {
        // Calculate next attempt time with exponential backoff
        const backoffMinutes = Math.pow(2, attempts); // 2, 4, 8, 16, etc. minutes
        const nextAttemptAt = new Date();
        nextAttemptAt.setMinutes(nextAttemptAt.getMinutes() + backoffMinutes);
        
        console.log(`[DEBUG] Scheduling retry in ${backoffMinutes} minutes`);
        await db.update(emailQueue)
          .set({
            status: 'retrying',
            attempts,
            error: result.error,
            nextAttemptAt,
            updatedAt: new Date(),
          })
          .where(eq(emailQueue.id, email.id));
      }
      
      return { success: false, error: result.error };
    } else {
      console.log('[DEBUG] Email sent successfully with ID:', result.id);
      
      // Email was sent successfully, update the queue record
      await db.update(emailQueue)
        .set({
          status: 'sent',
          sentAt: new Date(),
          updatedAt: new Date(),
          emailId: result.id
        })
        .where(eq(emailQueue.id, email.id));
      
      return { success: true, emailId: result.id };
    }
  } catch (error) {
    console.error('[DEBUG] Error in processQueueItem:', error);
    
    // Update the queue record with the error
    const attempts = email.attempts + 1;
    const maxAttempts = email.maxAttempts || 3;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (attempts >= maxAttempts) {
      await db.update(emailQueue)
        .set({
          status: 'failed',
          attempts,
          error: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(emailQueue.id, email.id));
    } else {
      const backoffMinutes = Math.pow(2, attempts);
      const nextAttemptAt = new Date();
      nextAttemptAt.setMinutes(nextAttemptAt.getMinutes() + backoffMinutes);
      
      await db.update(emailQueue)
        .set({
          status: 'retrying',
          attempts,
          error: errorMessage,
          nextAttemptAt,
          updatedAt: new Date(),
        })
        .where(eq(emailQueue.id, email.id));
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Process the email queue, sending any pending emails
 */
export async function processQueue(options: {
  limit?: number;
  includeRetrying?: boolean;
} = {}): Promise<{ processed: number; success: number; failed: number }> {
  const limit = options.limit || 10;
  const includeRetrying = options.includeRetrying || false;
  
  let processed = 0;
  let success = 0;
  let failed = 0;
  
  try {
    // Get pending emails from the queue
    const query = db.select().from(emailQueue).where(
      includeRetrying 
        ? or(
            eq(emailQueue.status, 'pending'),
            and(
              eq(emailQueue.status, 'retrying'),
              lte(emailQueue.nextAttemptAt, new Date())
            )
          )
        : eq(emailQueue.status, 'pending')
    ).limit(limit);
    
    const pendingEmails = await query;
    
    if (pendingEmails.length === 0) {
      return { processed: 0, success: 0, failed: 0 };
    }
    
    // Process each email
    for (const email of pendingEmails) {
      processed++;
      
      const result = await processQueueItem(email);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }
    
    return { processed, success, failed };
  } catch (error) {
    console.error('Error processing email queue:', error);
    throw error;
  }
} 