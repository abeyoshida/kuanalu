import { z } from "zod";

// Base comment type
export type Comment = {
  id: number;
  content: string;
  type: 'text' | 'code' | 'attachment' | 'system' | 'mention';
  taskId: number;
  userId: number;
  parentId: number | null;
  edited: boolean;
  editedAt: Date | null;
  editedBy: number | null;
  isResolved: boolean;
  resolvedAt: Date | null;
  resolvedBy: number | null;
  metadata: Record<string, unknown> | null;
  mentions: string[] | null;
  createdAt: Date;
  updatedAt: Date;
};

// Comment with additional metadata
export type CommentWithMeta = Comment & {
  userName: string;
  userImage: string | null;
  editorName?: string;
  resolverName?: string;
};

// Schema for creating a comment
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  type: z.enum(['text', 'code', 'attachment', 'system', 'mention']).optional(),
  taskId: z.number().int().positive("Task ID is required"),
  parentId: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
  mentions: z.array(z.string()).optional()
});

// Type for creating a comment
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// Schema for updating a comment
export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").optional(),
  isResolved: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
  mentions: z.array(z.string()).optional()
});

// Type for updating a comment
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

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