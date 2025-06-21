import { InferSelectModel } from 'drizzle-orm';
import { subtasks } from '@/lib/db/schema';
import { z } from "zod";

// Subtask type based on the schema
export type Subtask = InferSelectModel<typeof subtasks>;

// Subtask with additional fields for the UI
export interface SubtaskWithMeta extends Subtask {
  assigneeName?: string;
}

// Schema for creating a subtask
export const createSubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required"),
  description: z.string().optional(),
  completed: z.boolean().optional().default(false),
  priority: z.string().optional(),
  taskId: z.number().int().positive("Task ID is required"),
  assigneeId: z.number().int().positive().optional().nullable(),
  estimatedHours: z.number().positive().optional().nullable(),
  actualHours: z.number().positive().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  position: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Type for creating a subtask with proper date handling
export type CreateSubtaskSchemaType = z.infer<typeof createSubtaskSchema>;

// Schema for updating a subtask
export const updateSubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required").optional(),
  description: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  priority: z.string().optional().nullable(),
  assigneeId: z.number().int().positive().optional().nullable(),
  estimatedHours: z.number().positive().optional().nullable(),
  actualHours: z.number().positive().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  position: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Type for updating a subtask with proper date handling
export type UpdateSubtaskSchemaType = z.infer<typeof updateSubtaskSchema>;

// Function to convert schema data to create subtask input
export function convertToCreateSubtaskInput(data: CreateSubtaskSchemaType): CreateSubtaskInput {
  return {
    ...data,
    dueDate: data.dueDate ? new Date(data.dueDate) : null
  };
}

// Function to convert schema data to update subtask input
export function convertToUpdateSubtaskInput(data: UpdateSubtaskSchemaType): UpdateSubtaskInput {
  return {
    ...data,
    dueDate: data.dueDate ? new Date(data.dueDate) : (data.dueDate === null ? null : undefined),
    position: data.position === null ? undefined : data.position
  };
}

// Schema for updating subtask position
export const updateSubtaskPositionSchema = z.object({
  newPosition: z.number().int().min(0)
});

// Type for subtask creation input
export interface CreateSubtaskInput {
  title: string;
  description?: string;
  completed?: boolean;
  priority?: string;
  taskId: number;
  assigneeId?: number | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  dueDate?: Date | null;
  position?: number | null;
  metadata?: Record<string, unknown>;
}

// Type for subtask update input
export interface UpdateSubtaskInput {
  title?: string;
  description?: string | null;
  completed?: boolean;
  priority?: string | null;
  assigneeId?: number | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  dueDate?: Date | null;
  position?: number | null;
  metadata?: Record<string, unknown>;
}

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