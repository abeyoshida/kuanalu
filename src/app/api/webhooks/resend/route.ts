import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailQueue, emailStatusEnum } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { SQL } from 'drizzle-orm';

// Define the types for the webhook payload
type ResendWebhookEvent = {
  type: string;
  data: {
    email_id: string;
    to: string;
    from: string;
    created_at: string;
    [key: string]: any; // Additional properties depending on event type
  };
};

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
async function updateEmailStatus(emailId: string, status: 'pending' | 'sent' | 'failed' | 'retrying') {
  try {
    await db.update(emailQueue)
      .set({
        status: status as any, // Cast to any to bypass type checking
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
async function updateEmailWithError(emailId: string, status: 'pending' | 'sent' | 'failed' | 'retrying', errorMessage: string) {
  try {
    await db.update(emailQueue)
      .set({
        status: status as any, // Cast to any to bypass type checking
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
async function updateEmailMetadata(emailId: string, eventData: any) {
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
    const metadata = email.metadata || {};
    
    // Update the metadata based on the event type
    if (eventData.event === 'opened') {
      const opens = (metadata as any).opens || 0;
      const openEvents = (metadata as any).openEvents || [];
      
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
          },
        })
        .where(eq(emailQueue.emailId, emailId));
    } else if (eventData.event === 'clicked') {
      const clicks = (metadata as any).clicks || 0;
      const clickEvents = (metadata as any).clickEvents || [];
      
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
          },
        })
        .where(eq(emailQueue.emailId, emailId));
    }
  } catch (error) {
    console.error(`Error updating email metadata:`, error);
  }
}

/**
 * Handle email.sent event
 * 
 * @param data The event data
 */
async function handleEmailSent(data: any) {
  try {
    // Update the email status in the database
    await db.update(emailQueue)
      .set({
        status: 'sent',
        updatedAt: new Date(),
      })
      .where(eq(emailQueue.emailId, data.email_id));
  } catch (error) {
    console.error('Error handling email.sent webhook:', error);
  }
}

/**
 * Handle email.delivered event
 * 
 * @param data The event data
 */
async function handleEmailDelivered(data: any) {
  try {
    // Update the email status in the database
    await db.update(emailQueue)
      .set({
        status: 'sent',
        updatedAt: new Date(),
      })
      .where(eq(emailQueue.emailId, data.email_id));
  } catch (error) {
    console.error('Error handling email.delivered webhook:', error);
  }
}

/**
 * Handle email.delivery_delayed event
 * 
 * @param data The event data
 */
async function handleEmailDeliveryDelayed(data: any) {
  try {
    // Update the email status in the database
    await db.update(emailQueue)
      .set({
        status: 'failed',
        updatedAt: new Date(),
        error: `Delivery delayed: ${data.reason || 'Unknown reason'}`,
      })
      .where(eq(emailQueue.emailId, data.email_id));
  } catch (error) {
    console.error('Error handling email.delivery_delayed webhook:', error);
  }
}

/**
 * Handle email.complained event
 * 
 * @param data The event data
 */
async function handleEmailComplained(data: any) {
  try {
    // Update the email status in the database
    await db.update(emailQueue)
      .set({
        status: 'failed',
        updatedAt: new Date(),
        error: 'Recipient marked as spam',
      })
      .where(eq(emailQueue.emailId, data.email_id));
    
    // TODO: Consider adding the recipient to a suppression list
  } catch (error) {
    console.error('Error handling email.complained webhook:', error);
  }
}

/**
 * Handle email.bounced event
 * 
 * @param data The event data
 */
async function handleEmailBounced(data: any) {
  try {
    // Update the email status in the database
    await db.update(emailQueue)
      .set({
        status: 'failed',
        updatedAt: new Date(),
        error: `Bounced: ${data.reason || 'Unknown reason'}`,
      })
      .where(eq(emailQueue.emailId, data.email_id));
    
    // TODO: Consider adding the recipient to a suppression list if it's a hard bounce
  } catch (error) {
    console.error('Error handling email.bounced webhook:', error);
  }
}

/**
 * Handle email.opened event
 * 
 * @param data The event data
 */
async function handleEmailOpened(data: any) {
  try {
    // Update the email metadata in the database
    const [email] = await db.select().from(emailQueue).where(eq(emailQueue.emailId, data.email_id));
    
    if (email) {
      const metadata = email.metadata || {};
      const opens = (metadata as any).opens || 0;
      const openEvents = (metadata as any).openEvents || [];
      
      // Add this open event
      openEvents.push({
        timestamp: new Date(),
        ip: data.ip,
        user_agent: data.user_agent,
        location: data.location,
      });
      
      // Update the metadata
      await db.update(emailQueue)
        .set({
          metadata: {
            ...metadata,
            opens: opens + 1,
            openEvents,
            lastOpened: new Date(),
          },
        })
        .where(eq(emailQueue.emailId, data.email_id));
    }
  } catch (error) {
    console.error('Error handling email.opened webhook:', error);
  }
}

/**
 * Handle email.clicked event
 * 
 * @param data The event data
 */
async function handleEmailClicked(data: any) {
  try {
    // Update the email metadata in the database
    const [email] = await db.select().from(emailQueue).where(eq(emailQueue.emailId, data.email_id));
    
    if (email) {
      const metadata = email.metadata || {};
      const clicks = (metadata as any).clicks || 0;
      const clickEvents = (metadata as any).clickEvents || [];
      
      // Add this click event
      clickEvents.push({
        timestamp: new Date(),
        ip: data.ip,
        user_agent: data.user_agent,
        location: data.location,
        url: data.url,
      });
      
      // Update the metadata
      await db.update(emailQueue)
        .set({
          metadata: {
            ...metadata,
            clicks: clicks + 1,
            clickEvents,
            lastClicked: new Date(),
          },
        })
        .where(eq(emailQueue.emailId, data.email_id));
    }
  } catch (error) {
    console.error('Error handling email.clicked webhook:', error);
  }
} 