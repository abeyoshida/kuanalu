import { Resend } from 'resend';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { emailQueue } from '@/lib/db/schema';

// Define the EmailOptions type
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  queueId?: number;
  htmlContent?: string;
  textContent?: string;
  tags?: string[];
}

// Initialize Resend client with API key from environment variables
let resendClient: Resend | null = null;

try {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    resendClient = new Resend(apiKey);
  } else {
    console.warn('RESEND_API_KEY not found in environment variables');
  }
} catch (error) {
  console.error('Failed to initialize Resend client:', error);
}

// Function to send an email
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!resendClient) {
      throw new Error('Resend client not initialized');
    }

    // Define a type that matches what we need for Resend
    interface EmailData {
      from: string;
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
      cc?: string | string[];
      bcc?: string | string[];
      reply_to?: string;
      tags?: { name: string; value: string }[];
      [key: string]: unknown; // Allow additional properties
    }

    // Prepare email data with required fields
    const emailData: EmailData = {
      from: options.from || process.env.EMAIL_FROM || `FlowBoardAI <support@flowboardai.com>`,
      to: options.to,
      subject: options.subject,
    };

    // In development or if using Resend in test mode, redirect all emails to the developer's email
    // This is required by Resend's free tier which only allows sending to verified emails
    // NOTE: Since we're now using a verified domain, we can send to any email address
    // Uncomment this section if you need to redirect emails during testing
    /*
    if (process.env.NODE_ENV === 'development' || process.env.EMAIL_DEV_MODE === 'test') {
      // Store the original recipient in the email for reference
      emailData.originalRecipient = emailData.to;
      
      // Use the developer's email address from the environment variable or default to a safe value
      const devEmail = process.env.DEVELOPER_EMAIL || 'abeyoshida@gmail.com';
      console.log(`[DEV MODE] Redirecting email from ${emailData.to} to ${devEmail}`);
      emailData.to = devEmail;
    }
    */

    // Add HTML or text content
    if (options.html) {
      emailData.html = options.html;
    } else if (options.htmlContent) {
      emailData.html = options.htmlContent;
    }

    if (options.text) {
      emailData.text = options.text;
    } else if (options.textContent) {
      emailData.text = options.textContent;
    }

    // Add optional fields if they exist
    if (options.cc) emailData.cc = options.cc;
    if (options.bcc) emailData.bcc = options.bcc;
    if (options.replyTo) emailData.reply_to = options.replyTo;

    // Add tags if they exist
    if (options.tags && Array.isArray(options.tags)) {
      emailData.tags = options.tags.map(tag => ({ name: tag, value: tag }));
    }

    // Make sure text is defined if html is provided but text is not
    if (emailData.html && !emailData.text) {
      emailData.text = "Please view this email in an HTML-capable email client.";
    }

    // Send the email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await resendClient.emails.send(emailData as any);

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.error('No data returned from email service');
      return { success: false, error: 'No data returned from email service' };
    }

    console.log('Email sent successfully:', data);

    // Update the email queue record with the email ID from Resend
    if (options.queueId) {
      await db.update(emailQueue)
        .set({ 
          emailId: data.id,
          sentAt: new Date(),
          status: 'sent',
          updatedAt: new Date()
        })
        .where(eq(emailQueue.id, options.queueId));
    }

    return {
      success: true,
      id: data.id,
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
} 