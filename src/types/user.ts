import { InferSelectModel } from 'drizzle-orm';
import { users, userSessions, userPermissions } from '@/lib/db/schema';

// User type based on the schema
export type User = InferSelectModel<typeof users>;

// Safe user type (without sensitive information)
export type SafeUser = Omit<User, 'password'> & {
  organizations?: {
    id: number;
    name: string;
    role: string;
  }[];
};

// User session type based on the schema
export type UserSession = InferSelectModel<typeof userSessions>;

// User permission type based on the schema
export type UserPermission = InferSelectModel<typeof userPermissions>;

// User status type
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

// User preferences type
export interface UserPreferences {
  theme?: {
    mode?: 'light' | 'dark' | 'system';
    primaryColor?: string;
  };
  notifications?: {
    email?: boolean;
    browser?: boolean;
    taskAssignments?: boolean;
    taskUpdates?: boolean;
    comments?: boolean;
    mentions?: boolean;
  };
  dashboard?: {
    defaultView?: 'kanban' | 'list' | 'calendar';
    showCompletedTasks?: boolean;
    taskSortOrder?: 'priority' | 'dueDate' | 'createdAt';
  };
}

// User creation input type
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  image?: string;
  bio?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  timezone?: string;
  phoneNumber?: string;
  isAdmin?: boolean;
}

// User update input type
export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  image?: string;
  bio?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  timezone?: string;
  phoneNumber?: string;
  status?: UserStatus;
  isAdmin?: boolean;
  preferences?: UserPreferences;
}

// User with organizations type
export interface UserWithOrganizations extends SafeUser {
  organizations: {
    id: number;
    name: string;
    role: string;
    slug: string;
  }[];
}

// User permission input type
export interface UserPermissionInput {
  userId: number;
  organizationId?: number;
  projectId?: number;
  resource: string;
  action: string;
  granted: boolean;
} 