import { sendEmail } from './client';
import { TaskAssignmentEmail } from '@/components/email/task-assignment-email';
import React from 'react';
import { renderEmail } from './render';

/**
 * Send a task assignment email to a user
 * 
 * @param recipientEmail The email address of the recipient
 * @param recipientName The name of the recipient
 * @param assignerName The name of the person assigning the task
 * @param taskTitle The title of the task
 * @param taskId The ID of the task
 * @param projectName The name of the project
 * @param organizationName The name of the organization
 * @param dueDate Optional due date for the task
 * @param priority Optional priority of the task
 * @returns The result of sending the email
 */
export async function sendTaskAssignmentEmail({
  recipientEmail,
  recipientName,
  assignerName,
  taskTitle,
  taskId,
  projectName,
  organizationName,
  dueDate,
  priority,
}: {
  recipientEmail: string;
  recipientName: string;
  assignerName: string;
  taskTitle: string;
  taskId: number;
  projectName: string;
  organizationName: string;
  dueDate?: Date;
  priority?: string;
}) {
  // Create the email component
  const emailComponent = React.createElement(TaskAssignmentEmail, {
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

  // Render the email component to HTML
  const emailHtml = await renderEmail(emailComponent);

  // Send the email
  return sendEmail({
    to: recipientEmail,
    from: `${organizationName} <tasks@emails.hogalulu.com>`,
    subject: `Task Assignment: ${taskTitle}`,
    html: emailHtml,
  });
} 