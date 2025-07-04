import { sendEmail } from './client';
import { TaskAssignmentEmailData } from './types';
import React from 'react';

/**
 * Send a task assignment email notification
 * 
 * @param data Task assignment email data
 * @returns The result of sending the email
 */
export async function sendTaskAssignmentEmail(data: TaskAssignmentEmailData) {
  const {
    recipientEmail,
    recipientName,
    assignerName,
    taskTitle,
    taskId,
    projectName,
    organizationName,
    dueDate,
    priority,
  } = data;

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const taskUrl = `${baseUrl}/task/${taskId}`;

  // For now, we'll use a simple email without a specific component
  // In a future task, we'll create a TaskAssignmentEmail component
  return sendEmail({
    to: recipientEmail,
    subject: `[${organizationName}] Task assigned to you: ${taskTitle}`,
    react: React.createElement('div', {}, [
      React.createElement('h1', {}, 'Task Assigned to You'),
      React.createElement('p', {}, `Hello ${recipientName},`),
      React.createElement('p', {}, [
        React.createElement('strong', {}, assignerName),
        ' has assigned a task to you in project ',
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
        priority && React.createElement('p', { style: { margin: '5px 0' } }, [
          React.createElement('strong', {}, 'Priority:'),
          ` ${priority}`
        ]),
        dueDate && React.createElement('p', { style: { margin: '5px 0' } }, [
          React.createElement('strong', {}, 'Due Date:'),
          ` ${new Date(dueDate).toLocaleDateString()}`
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