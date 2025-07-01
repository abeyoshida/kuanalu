import { InferSelectModel } from 'drizzle-orm';
import { tasks, subtasks, comments, priorityEnum, taskStatusEnum, taskTypeEnum } from '@/lib/db/schema';
import { z } from "zod";

// Task type based on the schema
export type Task = InferSelectModel<typeof tasks>;

// Task with additional fields for the UI
export interface TaskWithMeta extends Task {
  assigneeName?: string;
  reporterName?: string;
  subtaskCount?: number;
  commentCount?: number;
  childTaskCount?: number;
  isOverdue?: boolean;
}

// Subtask type based on the schema
export type Subtask = InferSelectModel<typeof subtasks>;

// Comment type based on the schema
export type Comment = InferSelectModel<typeof comments>;

// Task status type
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

// Task priority type
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Task type type
export type TaskType = 'feature' | 'bug' | 'improvement' | 'documentation' | 'task' | 'epic';

// Task label type
export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

// Task metadata type
export interface TaskMetadata {
  customFields?: Record<string, unknown>;
  links?: {
    url: string;
    title?: string;
    type?: string;
  }[];
  watchers?: number[];
  history?: {
    timestamp: string;
    userId: number;
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
}

// Task creation input type
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  projectId: number;
  assigneeId?: number | null;
  reporterId?: number;
  parentTaskId?: number | null;
  dueDate?: Date | null;
  startDate?: Date | null;
  estimatedHours?: number | null;
  points?: number | null;
  position?: number | null;
  labels?: TaskLabel[];
}

// Task update input type
export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assigneeId?: number | null;
  reporterId?: number | null;
  parentTaskId?: number | null;
  dueDate?: Date | null;
  startDate?: Date | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  points?: number | null;
  position?: number | null;
  labels?: TaskLabel[];
  metadata?: TaskMetadata;
  archived?: boolean;
}

// Task filter options
export interface TaskFilterOptions {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  type?: TaskType[];
  assigneeId?: number[];
  reporterId?: number[];
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  labels?: string[];
  search?: string;
  includeArchived?: boolean;
  includeCompleted?: boolean;
  page?: number;
  pageSize?: number;
}

// Pagination result interface
export interface PaginatedTasksResult {
  tasks: TaskWithMeta[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
}

// Task sort options
export enum TaskSortField {
  TITLE = 'title',
  STATUS = 'status',
  PRIORITY = 'priority',
  DUE_DATE = 'dueDate',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  ASSIGNEE = 'assigneeId',
  POSITION = 'position'
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export interface TaskSortOption {
  field: TaskSortField;
  direction: SortDirection;
}

// Schema for creating a task
export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(taskStatusEnum.enumValues).optional(),
  priority: z.enum(priorityEnum.enumValues).optional(),
  type: z.enum(taskTypeEnum.enumValues).optional(),
  projectId: z.number().int().positive("Project ID is required"),
  assigneeId: z.number().int().positive().optional().nullable(),
  reporterId: z.number().int().positive().optional(),
  parentTaskId: z.number().int().positive().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  estimatedHours: z.number().positive().optional().nullable(),
  points: z.number().int().positive().optional().nullable(),
  position: z.number().int().optional(),
  labels: z.array(z.string()).optional()
});

// Type for creating a task with proper date handling
export type CreateTaskSchemaType = z.infer<typeof createTaskSchema>;

// Schema for updating a task
export const updateTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").optional(),
  description: z.string().optional().nullable(),
  status: z.enum(taskStatusEnum.enumValues).optional(),
  priority: z.enum(priorityEnum.enumValues).optional(),
  type: z.enum(taskTypeEnum.enumValues).optional(),
  assigneeId: z.number().int().positive().optional().nullable(),
  reporterId: z.number().int().positive().optional().nullable(),
  parentTaskId: z.number().int().positive().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  estimatedHours: z.number().positive().optional().nullable(),
  actualHours: z.number().positive().optional().nullable(),
  points: z.number().int().positive().optional().nullable(),
  position: z.number().int().optional(),
  labels: z.array(z.string()).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
  archived: z.boolean().optional()
});

// Type for updating a task with proper date handling
export type UpdateTaskSchemaType = z.infer<typeof updateTaskSchema>;

// Function to convert schema data to UpdateTaskInput
export function convertToUpdateTaskInput(data: UpdateTaskSchemaType): UpdateTaskInput {
  return {
    ...data,
    dueDate: data.dueDate ? new Date(data.dueDate) : (data.dueDate === null ? null : undefined),
    startDate: data.startDate ? new Date(data.startDate) : (data.startDate === null ? null : undefined),
    labels: data.labels?.map(label => {
      if (typeof label === 'string') {
        return {
          id: label,
          name: label,
          color: '#6366F1' // Default indigo color
        };
      }
      return label as unknown as TaskLabel;
    })
  };
}

// Function to convert schema data to CreateTaskInput
export function convertToCreateTaskInput(data: CreateTaskSchemaType): CreateTaskInput {
  return {
    ...data,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    labels: data.labels?.map(label => {
      if (typeof label === 'string') {
        return {
          id: label,
          name: label,
          color: '#6366F1' // Default indigo color
        };
      }
      return label as unknown as TaskLabel;
    })
  };
} 