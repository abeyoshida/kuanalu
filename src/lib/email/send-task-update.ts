import { sendEmail } from './client';
import { TaskUpdateEmailData } from './types';
import React from 'react';

/**
 * Send a task update email notification
 * 
 * @param data Task update email data
 * @returns The result of sending the email
 */
export async function sendTaskUpdateEmail(data: TaskUpdateEmailData) {
  const {
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
  } = data;

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const taskUrl = `${baseUrl}/task/${taskId}`;

  // Format the update type for display
  const updateTypeDisplay = updateType
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());

  return sendEmail({
    to: recipientEmail,
    subject: `[${organizationName}] Task updated: ${taskTitle}`,
    react: React.createElement('div', {}, [
      React.createElement('h1', {}, 'Task Updated'),
      React.createElement('p', {}, `Hello ${recipientName},`),
      React.createElement('p', {}, [
        React.createElement('strong', {}, updaterName),
        ` has updated the ${updateType} of a task in project `,
        React.createElement('strong', {}, projectName),
        '.',
      ]),
      React.createElement('div', { 
        style: { 
          margin: '20px 0', 
          padding: '15px', 
          border: '1px solid #e1e4e8', 
          borderRadius: '5px' 
        } 
      }, [
        React.createElement('h2', { style: { margin: '0 0 10px 0' } }, taskTitle),
        React.createElement('p', { style: { margin: '5px 0' } }, [
          React.createElement('strong', {}, `${updateTypeDisplay} changed from:`),
          React.createElement('br', {}),
          React.createElement('span', { style: { color: '#b91c1c' } }, oldValue || 'Not set'),
          React.createElement('br', {}),
          React.createElement('strong', {}, 'To:'),
          React.createElement('br', {}),
          React.createElement('span', { style: { color: '#15803d' } }, newValue || 'Not set')
        ])
      ]),
      React.createElement('p', {}, 
        React.createElement('a', {
          href: taskUrl,
          style: {
            backgroundColor: '#4f46e5',
            color: '#fff',
            padding: '10px 15px',
            borderRadius: '4px',
            textDecoration: 'none',
            display: 'inline-block',
          }
        }, 'View Task')
      ),
      React.createElement('p', {}, 'Thank you for using Kuanalu!')
    ])
  });
} 