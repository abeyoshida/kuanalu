import { InferSelectModel } from 'drizzle-orm';
import { comments } from '@/lib/db/schema';
import { User } from '@/types/user';
import { Task } from '@/types/task';

// Comment type based on the schema
export type Comment = InferSelectModel<typeof comments>;

// Comment with related data
export interface CommentWithMeta extends Comment {
  user?: User;
  task?: Task;
  parent?: Comment;
  replies?: Comment[];
  editor?: User;
  resolver?: User;
}

// Comment type enum
export type CommentType = 'text' | 'code' | 'attachment' | 'system' | 'mention';

// Input type for creating a new comment
export interface CreateCommentInput {
  content: string;
  type?: CommentType;
  taskId: number;
  userId: number;
  parentId?: number | null;
  mentions?: CommentMention[];
  metadata?: Record<string, unknown>;
}

// Input type for updating an existing comment
export interface UpdateCommentInput {
  id: number;
  content?: string;
  edited?: boolean;
  editedAt?: Date;
  editedBy?: number;
  isResolved?: boolean;
  resolvedAt?: Date | null;
  resolvedBy?: number | null;
  mentions?: CommentMention[];
  metadata?: Record<string, unknown>;
}

// Type for comment mention
export interface CommentMention {
  userId: number;
  userName: string;
  position: number; // Position in the content text
}

// Type for comment filtering
export interface CommentFilters {
  taskId?: number;
  userId?: number;
  parentId?: number | null;
  isResolved?: boolean;
  type?: CommentType;
  search?: string;
}

// Type for comment sorting
export type CommentSortField = 'createdAt' | 'updatedAt';

export interface CommentSortOptions {
  field: CommentSortField;
  direction: 'asc' | 'desc';
} 