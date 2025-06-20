import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { subtasks } from '@/lib/db/schema';
import { User } from '@/types/user';
import { Task } from '@/types/task';

// Base subtask type from database schema
export type Subtask = InferSelectModel<typeof subtasks>;

// Subtask with related data
export interface SubtaskWithMeta extends Subtask {
  task?: Task;
  assignee?: User;
  creator?: User;
}

// Input type for creating a new subtask
export interface CreateSubtaskInput {
  title: string;
  description?: string;
  taskId: number;
  assigneeId?: number;
  priority?: string;
  estimatedHours?: number;
  dueDate?: Date;
  position?: number;
  metadata?: Record<string, any>;
}

// Input type for updating an existing subtask
export interface UpdateSubtaskInput {
  id: number;
  title?: string;
  description?: string;
  completed?: boolean;
  assigneeId?: number | null;
  priority?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date | null;
  position?: number;
  metadata?: Record<string, any>;
  completedAt?: Date | null;
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