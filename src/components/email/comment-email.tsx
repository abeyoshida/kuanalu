import React from 'react';
import {
  Text,
  Button,
  Section,
  Heading,
} from '@react-email/components';
import { BaseEmailLayout } from './base-layout';

interface CommentEmailProps {
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
}

export const CommentEmail = ({
  recipientName,
  commenterName,
  taskTitle,
  taskId,
  commentId,
  commentContent,
  projectName,
  organizationName,
  isMention = false,
}: CommentEmailProps) => {
  // Create task URL
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const taskUrl = `${baseUrl}/task/${taskId}`;
  const commentUrl = `${baseUrl}/task/${taskId}?comment=${commentId}`;

  // Format comment content for display
  const formattedComment = formatCommentContent(commentContent);

  return (
    <BaseEmailLayout previewText={`${commenterName} ${isMention ? 'mentioned you in a comment' : 'commented on'} "${taskTitle}"`}>
      <Heading style={styles.heading}>
        {isMention ? 'You were mentioned in a comment' : 'New comment on your task'}
      </Heading>
      
      <Text style={styles.text}>
        Hello{' '}
        <span style={styles.highlight}>{recipientName}</span>,
      </Text>
      
      <Text style={styles.text}>
        <span style={styles.highlight}>{commenterName}</span>{' '}
        {isMention ? 'mentioned you in a comment on' : 'commented on'}{' '}
        <span style={styles.highlight}>{taskTitle}</span> in project{' '}
        <span style={styles.highlight}>{projectName}</span> at{' '}
        <span style={styles.highlight}>{organizationName}</span>.
      </Text>

      <Section style={styles.commentCard}>
        <Text style={styles.commentContent}>{formattedComment}</Text>
        <Text style={styles.commentMeta}>— {commenterName}</Text>
      </Section>
      
      <Section style={styles.buttonContainer}>
        <Button
          href={commentUrl}
          style={styles.button}
        >
          View Comment
        </Button>
      </Section>
      
      <Text style={styles.text}>
        You can reply to this comment by clicking the button above or visiting the task page.
      </Text>
      
      <Text style={styles.text}>
        If you can&apos;t click the button above, copy and paste this URL into your browser:
      </Text>
      
      <Text style={styles.link}>
        {commentUrl}
      </Text>
    </BaseEmailLayout>
  );
};

// Helper function to format comment content
function formatCommentContent(content: string): string {
  // Limit comment length if it's too long
  if (content.length > 500) {
    return content.substring(0, 500) + '...';
  }
  return content;
}

const styles = {
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '10px 0 24px',
  },
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#333',
    margin: '16px 0',
  },
  highlight: {
    fontWeight: 'bold',
  },
  commentCard: {
    backgroundColor: '#f9fafb',
    borderLeft: '4px solid #4f46e5',
    borderRadius: '4px',
    padding: '16px',
    margin: '24px 0',
  },
  commentContent: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#111827',
    margin: '0 0 16px 0',
    whiteSpace: 'pre-wrap' as const,
  },
  commentMeta: {
    fontSize: '14px',
    fontStyle: 'italic',
    color: '#6b7280',
    margin: '8px 0 0 0',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 20px',
  },
  link: {
    fontSize: '14px',
    color: '#556cd6',
    wordBreak: 'break-all' as const,
  },
}; 