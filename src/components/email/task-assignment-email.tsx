import React from 'react';
import {
  Text,
  Button,
  Section,
  Heading,
} from '@react-email/components';
import { BaseEmailLayout } from './base-layout';

interface TaskAssignmentEmailProps {
  recipientEmail: string;
  recipientName: string;
  assignerName: string;
  taskTitle: string;
  taskId: number;
  projectName: string;
  organizationName: string;
  dueDate?: Date;
  priority?: string;
}

export const TaskAssignmentEmail = ({
  recipientName,
  assignerName,
  taskTitle,
  taskId,
  projectName,
  organizationName,
  dueDate,
  priority,
}: TaskAssignmentEmailProps) => {
  // Format due date if provided
  const formattedDueDate = dueDate 
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(dueDate)
    : null;

  // Format priority if provided (capitalize)
  const formattedPriority = priority
    ? priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
    : null;

  // Create task URL
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const taskUrl = `${baseUrl}/task/${taskId}`;

  return (
    <BaseEmailLayout previewText={`You&apos;ve been assigned a task: ${taskTitle}`}>
      <Heading style={styles.heading}>Task Assignment</Heading>
      
      <Text style={styles.text}>
        Hello{' '}
        <span style={styles.highlight}>{recipientName}</span>,
      </Text>
      
      <Text style={styles.text}>
        <span style={styles.highlight}>{assignerName}</span> has assigned you a task in{' '}
        <span style={styles.highlight}>{projectName}</span> at{' '}
        <span style={styles.highlight}>{organizationName}</span>.
      </Text>

      <Section style={styles.taskCard}>
        <Text style={styles.taskTitle}>{taskTitle}</Text>
        
        {formattedPriority && (
          <Text style={{
            ...styles.taskDetail,
            color: getPriorityColor(priority || ''),
          }}>
            Priority: {formattedPriority}
          </Text>
        )}
        
        {formattedDueDate && (
          <Text style={styles.taskDetail}>
            Due: {formattedDueDate}
          </Text>
        )}
      </Section>
      
      <Section style={styles.buttonContainer}>
        <Button
          href={taskUrl}
          style={styles.button}
        >
          View Task
        </Button>
      </Section>
      
      <Text style={styles.text}>
        You can view and update this task at any time by clicking the button above or visiting your project dashboard.
      </Text>
      
      <Text style={styles.text}>
        If you can&apos;t click the button above, copy and paste this URL into your browser:
      </Text>
      
      <Text style={styles.link}>
        {taskUrl}
      </Text>
    </BaseEmailLayout>
  );
};

// Helper function to get color based on priority
function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return '#ef4444'; // red
    case 'high':
      return '#f97316'; // orange
    case 'medium':
      return '#eab308'; // yellow
    case 'low':
      return '#22c55e'; // green
    default:
      return '#6b7280'; // gray
  }
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
  taskCard: {
    backgroundColor: '#f9fafb',
    borderLeft: '4px solid #4f46e5',
    borderRadius: '4px',
    padding: '16px',
    margin: '24px 0',
  },
  taskTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#111827',
  },
  taskDetail: {
    fontSize: '14px',
    margin: '4px 0',
    color: '#4b5563',
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