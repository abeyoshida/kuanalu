import { InferSelectModel } from 'drizzle-orm';
import { projects, projectMembers, projectCategories, projectCategoryAssignments } from '@/lib/db/schema';

// Project type based on the schema
export type Project = InferSelectModel<typeof projects>;

// Project with additional fields for the UI
export interface ProjectWithMeta extends Project {
  memberCount?: number;
  taskCount?: number;
  ownerName?: string;
  categories?: ProjectCategory[];
}

// Project member type based on the schema
export type ProjectMember = InferSelectModel<typeof projectMembers>;

// Project member with user details
export interface ProjectMemberWithUser extends ProjectMember {
  user: {
    id: number;
    name: string;
    email: string;
    image: string | null;
  };
}

// Project category type based on the schema
export type ProjectCategory = InferSelectModel<typeof projectCategories>;

// Project category assignment type based on the schema
export type ProjectCategoryAssignment = InferSelectModel<typeof projectCategoryAssignments>;

// Project status type
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'canceled';

// Project visibility type
export type ProjectVisibility = 'public' | 'private' | 'team_only';

// Project settings type
export interface ProjectSettings {
  columns?: {
    id: string;
    name: string;
    status: string;
    color?: string;
    order: number;
  }[];
  defaultView?: 'kanban' | 'list' | 'calendar';
  enableSubtasks?: boolean;
  enableTimeTracking?: boolean;
  enableComments?: boolean;
  enableAttachments?: boolean;
  notifyOnTaskAssignment?: boolean;
  notifyOnTaskStatusChange?: boolean;
  notifyOnComments?: boolean;
}

// Project creation input type
export interface CreateProjectInput {
  name: string;
  description?: string;
  organizationId: number;
  ownerId?: number;
  status?: ProjectStatus;
  visibility?: ProjectVisibility;
  startDate?: Date;
  targetDate?: Date;
  icon?: string;
  color?: string;
  settings?: ProjectSettings;
  categoryIds?: number[];
}

// Project update input type
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  visibility?: ProjectVisibility;
  ownerId?: number;
  startDate?: Date | null;
  targetDate?: Date | null;
  completedDate?: Date | null;
  icon?: string;
  color?: string;
  settings?: ProjectSettings;
  archived?: boolean;
}

// Project member input type
export interface ProjectMemberInput {
  userId: number;
  projectId: number;
  role: 'owner' | 'admin' | 'member' | 'guest';
}

// Project category input type
export interface ProjectCategoryInput {
  name: string;
  description?: string;
  color?: string;
  organizationId: number;
} 