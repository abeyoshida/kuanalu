import { InferSelectModel } from 'drizzle-orm';
import { comments, commentTypeEnum } from '@/lib/db/schema';
import { z } from "zod";

// Comment type based on the schema
export type Comment = InferSelectModel<typeof comments>;

// Comment with additional fields for the UI
export interface CommentWithMeta extends Comment {
  userName?: string;
  userImage?: string;
  editorName?: string;
  resolverName?: string;
  replyCount?: number;
}

// Schema for creating a comment
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  type: z.enum(commentTypeEnum.enumValues).optional(),
  taskId: z.number().int().positive("Task ID is required"),
  parentId: z.number().int().positive().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
  mentions: z.array(z.string()).optional()
});

// Type for creating a comment
export type CreateCommentSchemaType = z.infer<typeof createCommentSchema>;

// Schema for updating a comment
export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").optional(),
  isResolved: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
  mentions: z.array(z.string()).optional()
});

// Type for updating a comment
export type UpdateCommentSchemaType = z.infer<typeof updateCommentSchema>;

// Type for comment creation input
export interface CreateCommentInput {
  content: string;
  type?: 'text' | 'code' | 'attachment' | 'system' | 'mention';
  taskId: number;
  parentId?: number | null;
  metadata?: Record<string, unknown>;
  mentions?: string[];
}

// Type for comment update input
export interface UpdateCommentInput {
  content?: string;
  isResolved?: boolean;
  metadata?: Record<string, unknown>;
  mentions?: string[];
}

// Type for comment filtering
export interface CommentFilters {
  taskId?: number;
  userId?: number;
  parentId?: number | null;
  isResolved?: boolean;
  type?: string;
}

// Type for comment sorting
export type CommentSortField = 'createdAt' | 'updatedAt';

export interface CommentSortOptions {
  field: CommentSortField;
  direction: 'asc' | 'desc';
} 