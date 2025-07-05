import React from 'react';
import {
  Text,
  Button,
  Section,
  Heading,
} from '@react-email/components';
import { BaseEmailLayout } from './base-layout';

interface TaskUpdateEmailProps {
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
}

export const TaskUpdateEmail = ({
  recipientName,
  updaterName,
  taskTitle,
  taskId,
  projectName,
  organizationName,
  updateType,
  oldValue,
  newValue,
}: TaskUpdateEmailProps) => {
  // Create task URL
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const taskUrl = `${baseUrl}/task/${taskId}`;

  // Format update message based on update type
  const getUpdateMessage = () => {
    switch (updateType) {
      case 'status':
        return (
          <Text style={styles.text}>
            The status has been changed from{' '}
            <span style={styles.highlight}>{formatValue(oldValue)}</span> to{' '}
            <span style={styles.highlight}>{formatValue(newValue)}</span>.
          </Text>
        );
      case 'priority':
        return (
          <Text style={styles.text}>
            The priority has been changed from{' '}
            <span style={{...styles.highlight, color: getPriorityColor(oldValue || '')}}>{formatValue(oldValue)}</span> to{' '}
            <span style={{...styles.highlight, color: getPriorityColor(newValue || '')}}>{formatValue(newValue)}</span>.
          </Text>
        );
      case 'dueDate':
        return (
          <Text style={styles.text}>
            The due date has been {!oldValue ? 'set to' : 'changed from'}{' '}
            {oldValue && <span style={styles.highlight}>{formatValue(oldValue)}</span>}
            {oldValue && ' to '}
            <span style={styles.highlight}>{formatValue(newValue)}</span>.
          </Text>
        );
      case 'description':
        return (
          <Text style={styles.text}>
            The task description has been updated.
          </Text>
        );
      default:
        return (
          <Text style={styles.text}>
            The task has been updated.
          </Text>
        );
    }
  };

  // Format value for display
  const formatValue = (value?: string) => {
    if (!value) return 'none';
    
    if (updateType === 'status' || updateType === 'priority') {
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
    
    if (updateType === 'dueDate') {
      try {
        return new Intl.DateTimeFormat('en-US', {
          dateStyle: 'long',
          timeStyle: 'short',
        }).format(new Date(value));
      } catch (e) {
        return value;
      }
    }
    
    return value;
  };

  return (
    <BaseEmailLayout previewText={`Task update: ${taskTitle}`}>
      <Heading style={styles.heading}>Task Update</Heading>
      
      <Text style={styles.text}>
        Hello{' '}
        <span style={styles.highlight}>{recipientName}</span>,
      </Text>
      
      <Text style={styles.text}>
        <span style={styles.highlight}>{updaterName}</span> has updated a task in{' '}
        <span style={styles.highlight}>{projectName}</span> at{' '}
        <span style={styles.highlight}>{organizationName}</span>.
      </Text>

      <Section style={styles.taskCard}>
        <Text style={styles.taskTitle}>{taskTitle}</Text>
        {getUpdateMessage()}
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
        You can view the complete task details by clicking the button above or visiting your project dashboard.
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