import { sendEmail } from './client';
import { TaskUpdateEmail } from '@/components/email/task-update-email';
import React from 'react';
import { renderEmail } from './render';

/**
 * Send a task update email to a user
 * 
 * @param recipientEmail The email address of the recipient
 * @param recipientName The name of the recipient
 * @param updaterName The name of the person updating the task
 * @param taskTitle The title of the task
 * @param taskId The ID of the task
 * @param projectName The name of the project
 * @param organizationName The name of the organization
 * @param updateType The type of update (status, priority, dueDate, description, other)
 * @param oldValue Optional old value before the update
 * @param newValue Optional new value after the update
 * @returns The result of sending the email
 */
export async function sendTaskUpdateEmail({
  recipientEmail,
  recipientName,
  updaterName,
  taskTitle,
  taskId,
  projectName,
  organizationName,
  updateType,
  oldValue,
  newValue,
}: {
  recipientEmail: string;
  recipientName: string;
  updaterName: string;
  taskTitle: string;
  taskId: number;
  projectName: string;
  organizationName: string;
  updateType: 'status' | 'priority' | 'dueDate' | 'description' | 'other';
  oldValue?: string;
  newValue?: string;
}) {
  // Create the email component
  const emailComponent = React.createElement(TaskUpdateEmail, {
    recipientEmail,
    recipientName,
    updaterName,
    taskTitle,
    taskId,
    projectName,
    organizationName,
    updateType,
    oldValue,
    newValue,
  });

  // Render the email component to HTML
  const emailHtml = await renderEmail(emailComponent);

  // Create a subject line based on the update type
  let subject = `Task Update: ${taskTitle}`;
  if (updateType === 'status') {
    subject = `Task Status Updated: ${taskTitle}`;
  } else if (updateType === 'priority') {
    subject = `Task Priority Updated: ${taskTitle}`;
  } else if (updateType === 'dueDate') {
    subject = `Task Due Date Updated: ${taskTitle}`;
  }

  // Send the email
  return sendEmail({
    to: recipientEmail,
    from: `${organizationName} <updates@hogalulu.com>`,
    subject,
    html: emailHtml,
  });
} 