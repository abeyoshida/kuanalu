import { pgTable, serial, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { db } from '../index';

// Define the email queue table
export const emailQueue = pgTable('email_queue', {
  id: serial('id').primaryKey(),
  to: text('to').notNull(), // Can be a single email or JSON array of emails
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),
  from: text('from').notNull(),
  cc: text('cc'), // Can be a single email or JSON array of emails
  bcc: text('bcc'), // Can be a single email or JSON array of emails
  replyTo: text('reply_to'),
  status: text('status').notNull().default('pending'), // pending, sent, failed, retrying
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  error: text('error'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  nextAttemptAt: timestamp('next_attempt_at'),
  metadata: jsonb('metadata'), // Additional metadata about the email
  userId: integer('user_id'), // Optional reference to user who triggered the email
  organizationId: integer('organization_id'), // Optional reference to organization
  resourceType: text('resource_type'), // Type of resource this email is about (e.g., task, invitation)
  resourceId: integer('resource_id'), // ID of the resource this email is about
});

// Define the email notifications table
export const emailNotifications = pgTable('email_notifications', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // invitation, task_assignment, task_update, comment, mention
  recipientId: integer('recipient_id').notNull(), // User who should receive the notification
  senderId: integer('sender_id'), // User who triggered the notification
  resourceType: text('resource_type'), // Type of resource (task, comment, etc.)
  resourceId: integer('resource_id'), // ID of the resource
  emailId: text('email_id'), // ID returned from email service
  read: integer('read').notNull().default(0), // 0 = unread, 1 = read
  data: jsonb('data'), // Additional data about the notification
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Migration function to create the tables
export async function createEmailTables() {
  console.log('Creating email queue and notifications tables...');
  
  try {
    // Check if tables already exist
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'email_queue'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('Email queue table already exists, skipping creation');
      return;
    }
    
    // Create email queue table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_queue (
        id SERIAL PRIMARY KEY,
        "to" TEXT NOT NULL,
        subject TEXT NOT NULL,
        html_content TEXT NOT NULL,
        text_content TEXT,
        "from" TEXT NOT NULL,
        cc TEXT,
        bcc TEXT,
        reply_to TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        error TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        next_attempt_at TIMESTAMP,
        metadata JSONB,
        user_id INTEGER,
        organization_id INTEGER,
        resource_type TEXT,
        resource_id INTEGER
      );
    `);
    
    // Create email notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_notifications (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        recipient_id INTEGER NOT NULL,
        sender_id INTEGER,
        resource_type TEXT,
        resource_id INTEGER,
        email_id TEXT,
        read INTEGER NOT NULL DEFAULT 0,
        data JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create indexes for better performance
    await db.execute(sql`CREATE INDEX idx_email_queue_status ON email_queue (status);`);
    await db.execute(sql`CREATE INDEX idx_email_queue_next_attempt ON email_queue (next_attempt_at);`);
    await db.execute(sql`CREATE INDEX idx_email_notifications_recipient ON email_notifications (recipient_id);`);
    await db.execute(sql`CREATE INDEX idx_email_notifications_read ON email_notifications (read);`);
    
    console.log('Email tables created successfully');
  } catch (error) {
    console.error('Error creating email tables:', error);
    throw error;
  }
} 