import { sendEmail } from './client';
import { CommentEmailData } from './types';
import React from 'react';

/**
 * Send a comment notification email
 * 
 * @param data Comment email data
 * @returns The result of sending the email
 */
export async function sendCommentEmail(data: CommentEmailData) {
  const {
    recipientEmail,
    recipientName,
    commenterName,
    taskTitle,
    taskId,
    commentId,
    commentContent,
    projectName,
    organizationName,
  } = data;

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const taskUrl = `${baseUrl}/task/${taskId}#comment-${commentId}`;

  // Truncate comment content if it's too long
  const truncatedComment = commentContent.length > 150 
    ? `${commentContent.substring(0, 150)}...` 
    : commentContent;

  return sendEmail({
    to: recipientEmail,
    subject: `[${organizationName}] New comment on task: ${taskTitle}`,
    react: React.createElement('div', {}, [
      React.createElement('h1', {}, 'New Comment on Task'),
      React.createElement('p', {}, `Hello ${recipientName},`),
      React.createElement('p', {}, [
        React.createElement('strong', {}, commenterName),
        ' has commented on a task in project ',
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
        React.createElement('p', { style: { margin: '5px 0', fontWeight: 'bold' } }, 'Comment:'),
        React.createElement('div', { 
          style: { 
            backgroundColor: '#f6f8fa',
            padding: '10px', 
            borderRadius: '4px',
            fontStyle: 'italic'
          } 
        }, truncatedComment)
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
        }, 'View Comment')
      ),
      React.createElement('p', {}, 'Thank you for using Kuanalu!')
    ])
  });
} 