import { Resend } from 'resend';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { emailQueue } from '@/lib/db/schema';
import React from 'react';

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

    // Prepare email data with required fields
    const emailData: any = {
      from: options.from || "noreply@emails.hogalulu.com",
      to: options.to,
      subject: options.subject,
    };

    // Add optional fields if they exist
    if (options.html) emailData.html = options.html;
    if (options.text) emailData.text = options.text;
    if (options.cc) emailData.cc = options.cc;
    if (options.bcc) emailData.bcc = options.bcc;
    if (options.replyTo) emailData.replyTo = options.replyTo;

    // Ensure we have either html or text
    if (!options.html && !options.text) {
      emailData.text = 'No content provided'; // Fallback text
    }

    const { data, error } = await resendClient.emails.send(emailData);

    if (error || !data) {
      console.error('Failed to send email:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }

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

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 