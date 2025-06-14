export type TaskStatus = 'todo' | 'today' | 'doing' | 'blocked' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string | number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  projectId?: number;
  assigneeId?: number;
  dueDate?: Date | string;
  createdBy?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface Subtask {
  id: string | number;
  title: string;
  completed: boolean;
  taskId: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Comment {
  id: string | number;
  content: string;
  taskId: number;
  userId: number;
  user?: {
    id: number;
    name: string;
    email: string;
    image?: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
} 