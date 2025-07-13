import { sendEmail } from './client';
import { CommentEmail } from '@/components/email/comment-email';
import React from 'react';
import { renderEmail } from './render';

/**
 * Send a comment notification email to a user
 * 
 * @param recipientEmail The email address of the recipient
 * @param recipientName The name of the recipient
 * @param commenterName The name of the person who commented
 * @param taskTitle The title of the task
 * @param taskId The ID of the task
 * @param commentId The ID of the comment
 * @param commentContent The content of the comment
 * @param projectName The name of the project
 * @param organizationName The name of the organization
 * @param isMention Whether the notification is for a mention (true) or a comment (false)
 * @returns The result of sending the email
 */
export async function sendCommentEmail({
  recipientEmail,
  recipientName,
  commenterName,
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
  commenterName: string;
  taskTitle: string;
  taskId: number;
  commentId: number;
  commentContent: string;
  projectName: string;
  organizationName: string;
  isMention?: boolean;
}) {
  // Create the email component
  const emailComponent = React.createElement(CommentEmail, {
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

  // Render the email component to HTML
  const emailHtml = await renderEmail(emailComponent);

  // Create a subject line based on whether it's a mention or comment
  const subject = isMention
    ? `${commenterName} mentioned you in a comment on "${taskTitle}"`
    : `${commenterName} commented on "${taskTitle}"`;

  // Send the email
  return sendEmail({
    to: recipientEmail,
    from: process.env.EMAIL_FROM || `${organizationName} <comments@flowboardai.com>`,
    subject,
    html: emailHtml,
  });
} 