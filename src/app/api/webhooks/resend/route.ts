import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailQueue } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Define the types for the webhook payload
type ResendWebhookEvent = {
  type: string;
  data: {
    email_id: string;
    to: string;
    from: string;
    created_at: string;
    reason?: string;
    ip?: string;
    user_agent?: string;
    location?: string;
    url?: string;
    [key: string]: unknown;
  };
};

type EmailStatus = 'pending' | 'sent' | 'failed' | 'retrying';

interface EmailEventData {
  event: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  location?: string;
  url?: string;
}

interface EmailMetadata {
  opens?: number;
  openEvents?: Array<{
    timestamp: Date;
    ip?: string;
    userAgent?: string;
    location?: string;
  }>;
  lastOpened?: Date;
  clicks?: number;
  clickEvents?: Array<{
    timestamp: Date;
    ip?: string;
    userAgent?: string;
    location?: string;
    url?: string;
  }>;
  lastClicked?: Date;
  [key: string]: unknown;
}

/**
 * Verify the webhook signature from Resend
 * 
 * @param payload The raw request body
 * @param signature The signature from the request header
 * @returns Whether the signature is valid
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    
    // If no webhook secret is configured, skip verification
    if (!webhookSecret) {
      console.warn('RESEND_WEBHOOK_SECRET is not set. Webhook signature verification is disabled.');
      return true;
    }
    
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(payload).digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Webhook handler for Resend email delivery status updates
 * 
 * @param request The incoming request
 * @returns A response indicating success or failure
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw request body for signature verification
    const rawBody = await request.text();
    
    // Get the signature from the header
    const signature = request.headers.get('resend-signature');
    
    // Verify the signature if provided
    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Parse the webhook payload
    const payload = JSON.parse(rawBody) as ResendWebhookEvent;
    
    // Log the webhook event for debugging
    console.log('Received Resend webhook:', payload.type, payload);
    
    // Handle different event types
    switch (payload.type) {
      case 'email.sent':
        await updateEmailStatus(payload.data.email_id, 'sent');
        break;
      case 'email.delivered':
        await updateEmailStatus(payload.data.email_id, 'sent'); // We use 'sent' as we don't have a 'delivered' status
        break;
      case 'email.delivery_delayed':
        await updateEmailWithError(
          payload.data.email_id, 
          'failed', 
          `Delivery delayed: ${payload.data.reason || 'Unknown reason'}`
        );
        break;
      case 'email.complained':
        await updateEmailWithError(
          payload.data.email_id, 
          'failed', 
          'Recipient marked as spam'
        );
        break;
      case 'email.bounced':
        await updateEmailWithError(
          payload.data.email_id, 
          'failed', 
          `Bounced: ${payload.data.reason || 'Unknown reason'}`
        );
        break;
      case 'email.opened':
        await updateEmailMetadata(payload.data.email_id, {
          event: 'opened',
          timestamp: new Date(),
          ip: payload.data.ip,
          userAgent: payload.data.user_agent,
          location: payload.data.location,
        });
        break;
      case 'email.clicked':
        await updateEmailMetadata(payload.data.email_id, {
          event: 'clicked',
          timestamp: new Date(),
          ip: payload.data.ip,
          userAgent: payload.data.user_agent,
          location: payload.data.location,
          url: payload.data.url,
        });
        break;
      default:
        console.warn(`Unknown webhook event type: ${payload.type}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Resend webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * Update the email status in the database
 */
async function updateEmailStatus(emailId: string, status: EmailStatus) {
  try {
    await db.update(emailQueue)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(emailQueue.emailId, emailId));
  } catch (error) {
    console.error(`Error updating email status to ${status}:`, error);
  }
}

/**
 * Update the email status and error message in the database
 */
async function updateEmailWithError(emailId: string, status: EmailStatus, errorMessage: string) {
  try {
    await db.update(emailQueue)
      .set({
        status,
        error: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(emailQueue.emailId, emailId));
  } catch (error) {
    console.error(`Error updating email with error message:`, error);
  }
}

/**
 * Update the email metadata in the database
 */
async function updateEmailMetadata(emailId: string, eventData: EmailEventData) {
  try {
    // First get the current email record
    const emails = await db.select()
      .from(emailQueue)
      .where(eq(emailQueue.emailId, emailId));
    
    if (emails.length === 0) {
      console.warn(`Email with ID ${emailId} not found`);
      return;
    }
    
    const email = emails[0];
    const metadata = (email.metadata as EmailMetadata) || {};
    
    // Update the metadata based on the event type
    if (eventData.event === 'opened') {
      const opens = metadata.opens || 0;
      const openEvents = metadata.openEvents || [];
      
      openEvents.push({
        timestamp: eventData.timestamp,
        ip: eventData.ip,
        userAgent: eventData.userAgent,
        location: eventData.location,
      });
      
      await db.update(emailQueue)
        .set({
          metadata: {
            ...metadata,
            opens: opens + 1,
            openEvents,
            lastOpened: eventData.timestamp,
          } as unknown,
        })
        .where(eq(emailQueue.emailId, emailId));
    } else if (eventData.event === 'clicked') {
      const clicks = metadata.clicks || 0;
      const clickEvents = metadata.clickEvents || [];
      
      clickEvents.push({
        timestamp: eventData.timestamp,
        ip: eventData.ip,
        userAgent: eventData.userAgent,
        location: eventData.location,
        url: eventData.url,
      });
      
      await db.update(emailQueue)
        .set({
          metadata: {
            ...metadata,
            clicks: clicks + 1,
            clickEvents,
            lastClicked: eventData.timestamp,
          } as unknown,
        })
        .where(eq(emailQueue.emailId, emailId));
    }
  } catch (error) {
    console.error(`Error updating email metadata:`, error);
  }
} 