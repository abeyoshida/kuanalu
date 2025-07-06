import { db } from '@/lib/db';
import { invitations, organizations, users } from '@/lib/db/schema';
import { randomUUID } from 'crypto';
import { addToQueue } from '@/lib/email/queue';
import { renderEmail, renderEmailText } from '@/lib/email/render';
import { InvitationEmail } from '@/components/email/invitation-email';
import React from 'react';
import { processEmailQueue } from '@/lib/email/queue';

async function testInvitation() {
  try {
    console.log('Starting invitation test...');
    
    // First, check for existing users
    console.log('Checking for existing users...');
    const existingUsers = await db.select().from(users).limit(10);
    
    if (existingUsers.length === 0) {
      console.log('No users found in the database. Please run the seed script first.');
      return;
    }
    
    console.log(`Found ${existingUsers.length} users in the database.`);
    console.log('First user:', existingUsers[0]);
    
    // Use the first user as the inviter
    const invitedBy = existingUsers[0].id;
    
    // Check for existing organizations
    console.log('Checking for existing organizations...');
    const existingOrgs = await db.select().from(organizations).limit(10);
    
    if (existingOrgs.length === 0) {
      console.log('No organizations found in the database. Please run the seed script first.');
      return;
    }
    
    console.log(`Found ${existingOrgs.length} organizations in the database.`);
    console.log('First organization:', existingOrgs[0]);
    
    // Use the first organization
    const organizationId = existingOrgs[0].id;
    const organization = existingOrgs[0];
    
    // Configuration
    const email = 'delivered@resend.dev';
    const role = 'member';
    
    console.log(`Using organization ID: ${organizationId}, name: ${organization.name}`);
    console.log(`Using inviter ID: ${invitedBy}`);
    
    // Create invitation token and expiry date
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
    
    // Insert invitation into database
    console.log('Creating invitation...');
    const [invitation] = await db
      .insert(invitations)
      .values({
        token,
        email,
        organizationId,
        role,
        invitedBy,
        status: 'pending',
        expiresAt,
        createdAt: new Date(),
      })
      .returning();
    
    console.log('Invitation created:', invitation);
    
    // Create and queue email
    console.log('Creating and queuing email...');
    
    // Set up email parameters
    const inviterName = existingUsers[0].name || 'Test User';
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/invitations/accept?token=${token}`;
    
    // Create the invitation email component
    const emailComponent = React.createElement(InvitationEmail, {
      inviteeEmail: email,
      organizationName: organization.name,
      inviterName,
      invitationUrl,
      role,
      expiresAt,
    });
    
    // Render the email component to HTML and text
    const htmlContent = await renderEmail(emailComponent);
    const textContent = await renderEmailText(emailComponent);
    
    // Add the email to the queue
    const queueResult = await addToQueue({
      to: email,
      subject: `You've been invited to join ${organization.name}`,
      htmlContent,
      textContent,
      from: `Kuanalu <onboarding@resend.dev>`,
      metadata: {
        invitationType: 'organization',
        organizationName: organization.name,
        role,
        invitationToken: token,
      },
      userId: invitedBy,
      organizationId,
      resourceType: 'invitation',
    });
    
    console.log('Email queued:', queueResult);
    
    // Process the email queue
    console.log('Processing email queue...');
    const processedCount = await processEmailQueue(10);
    
    console.log(`Processed ${processedCount} emails from the queue`);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error in invitation test:', error);
  }
}

// Run the test
testInvitation().then(() => process.exit(0)).catch(() => process.exit(1)); 