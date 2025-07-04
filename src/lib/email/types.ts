import { ReactNode } from 'react';

/**
 * Base email options interface
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  react: ReactNode;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

/**
 * Email queue status enum
 */
export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

/**
 * Email queue item interface
 */
export interface EmailQueueItem {
  id: string;
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  from: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  status: EmailStatus;
  attempts: number;
  maxAttempts: number;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  nextAttemptAt?: Date;
}

/**
 * Email notification type enum
 */
export enum EmailNotificationType {
  INVITATION = 'invitation',
  TASK_ASSIGNMENT = 'task_assignment',
  TASK_UPDATE = 'task_update',
  COMMENT = 'comment',
  MENTION = 'mention',
}

/**
 * Email notification interface
 */
export interface EmailNotification {
  type: EmailNotificationType;
  recipientId: number;
  senderId?: number;
  resourceId?: number;
  resourceType?: string;
  emailId?: string;
  read: boolean;
  data: Record<string, any>;
  createdAt: Date;
}

/**
 * Invitation email data interface
 */
export interface InvitationEmailData {
  inviteeEmail: string;
  organizationName: string;
  inviterName: string;
  invitationToken: string;
  role: string;
  expiresAt: Date;
}

/**
 * Task assignment email data interface
 */
export interface TaskAssignmentEmailData {
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

/**
 * Task update email data interface
 */
export interface TaskUpdateEmailData {
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

/**
 * Comment email data interface
 */
export interface CommentEmailData {
  recipientEmail: string;
  recipientName: string;
  commenterName: string;
  taskTitle: string;
  taskId: number;
  commentId: number;
  commentContent: string;
  projectName: string;
  organizationName: string;
} 