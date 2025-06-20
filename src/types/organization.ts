import { InferSelectModel } from 'drizzle-orm';
import { organizations, organizationMembers } from '@/lib/db/schema';

// Organization type based on the schema
export type Organization = InferSelectModel<typeof organizations>;

// Organization with additional fields for the UI
export interface OrganizationWithMeta extends Organization {
  memberCount?: number;
  projectCount?: number;
  userRole?: string;
}

// Organization member type based on the schema
export type OrganizationMember = InferSelectModel<typeof organizationMembers>;

// Organization member with user details
export interface OrganizationMemberWithUser extends OrganizationMember {
  user: {
    id: number;
    name: string;
    email: string;
    image: string | null;
  };
}

// Organization visibility type
export type OrganizationVisibility = 'public' | 'private';

// Organization settings type
export interface OrganizationSettings {
  theme?: {
    primaryColor?: string;
    logo?: string;
  };
  notifications?: {
    email?: boolean;
    taskAssignments?: boolean;
    taskUpdates?: boolean;
    comments?: boolean;
    memberJoins?: boolean;
  };
  features?: {
    enableSubtasks?: boolean;
    enableTimeTracking?: boolean;
    enableAttachments?: boolean;
  };
}

// Organization creation input type
export interface CreateOrganizationInput {
  name: string;
  description?: string;
  visibility?: OrganizationVisibility;
}

// Organization update input type
export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  visibility?: OrganizationVisibility;
  logo?: string;
  website?: string;
  settings?: OrganizationSettings;
} 