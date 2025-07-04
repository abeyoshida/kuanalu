import { sendEmail } from './client';
import { InvitationEmail } from '@/components/email/invitation-email';
import React from 'react';
import { renderEmail } from './render';

/**
 * Send an invitation email to a user
 * 
 * @param inviteeEmail The email address of the invitee
 * @param organizationName The name of the organization
 * @param inviterName The name of the person sending the invitation
 * @param invitationToken The invitation token
 * @param role The role the invitee will have
 * @param expiresAt When the invitation expires
 * @returns The result of sending the email
 */
export async function sendInvitationEmail({
  inviteeEmail,
  organizationName,
  inviterName,
  invitationToken,
  role,
  expiresAt,
}: {
  inviteeEmail: string;
  organizationName: string;
  inviterName: string;
  invitationToken: string;
  role: string;
  expiresAt: Date;
}) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const invitationUrl = `${baseUrl}/invitations/accept?token=${invitationToken}`;

  const emailHtml = await renderEmail(React.createElement(InvitationEmail, {
    inviteeEmail,
    organizationName,
    inviterName,
    invitationUrl,
    role,
    expiresAt,
  }));

  return sendEmail({
    to: inviteeEmail,
    from: "invitations@emails.hogalulu.com",
    subject: `You've been invited to join ${organizationName}`,
    html: emailHtml,
  });
} 