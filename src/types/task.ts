import { InferSelectModel } from 'drizzle-orm';
import { tasks, subtasks, comments } from '@/lib/db/schema';

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