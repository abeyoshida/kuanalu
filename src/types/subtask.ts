import { z } from "zod";

// Base subtask type
export type Subtask = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string | null;
  taskId: number;
  assigneeId: number | null;
  estimatedHours: number | null;
  actualHours: number | null;
  dueDate: Date | null;
  position: number | null;
  metadata: Record<string, unknown> | null;
  completedAt: Date | null;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
};

// Subtask with additional metadata
export type SubtaskWithMeta = Subtask & {
  assigneeName?: string;
  creatorName?: string;
};

// Schema for creating a subtask
export const createSubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required"),
  description: z.string().optional(),
  taskId: z.number().int().positive("Task ID is required"),
  assigneeId: z.number().int().nullable().optional(),
  priority: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.date().optional(),
  position: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Type for creating a subtask
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;

// Schema for updating a subtask
export const updateSubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required").optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  priority: z.string().nullable().optional(),
  assigneeId: z.number().int().nullable().optional(),
  estimatedHours: z.number().nullable().optional(),
  actualHours: z.number().nullable().optional(),
  dueDate: z.date().nullable().optional(),
  position: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Type for updating a subtask
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;

// Type for subtask filtering
export interface SubtaskFilters {
  taskId?: number;
  assigneeId?: number;
  completed?: boolean;
  priority?: string;
}

// Type for subtask sorting
export type SubtaskSortField = 'position' | 'title' | 'dueDate' | 'priority' | 'createdAt';

export interface SubtaskSortOptions {
  field: SubtaskSortField;
  direction: 'asc' | 'desc';
} 