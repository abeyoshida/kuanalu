import { db } from "@/lib/db";
import { organizationMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// Define permission levels for different roles
export type Role = 'owner' | 'admin' | 'member' | 'guest';

export interface Permission {
  action: string;
  subject: string;
}

// Define permissions for each role
const rolePermissions: Record<Role, Permission[]> = {
  owner: [
    // Organization permissions
    { action: 'create', subject: 'organization' },
    { action: 'read', subject: 'organization' },
    { action: 'update', subject: 'organization' },
    { action: 'delete', subject: 'organization' },
    
    // Project permissions
    { action: 'create', subject: 'project' },
    { action: 'read', subject: 'project' },
    { action: 'update', subject: 'project' },
    { action: 'delete', subject: 'project' },
    
    // Task permissions
    { action: 'create', subject: 'task' },
    { action: 'read', subject: 'task' },
    { action: 'update', subject: 'task' },
    { action: 'delete', subject: 'task' },
    { action: 'assign', subject: 'task' },
    
    // User management permissions
    { action: 'invite', subject: 'user' },
    { action: 'remove', subject: 'user' },
    { action: 'update-role', subject: 'user' },
  ],
  
  admin: [
    // Organization permissions
    { action: 'read', subject: 'organization' },
    { action: 'update', subject: 'organization' },
    
    // Project permissions
    { action: 'create', subject: 'project' },
    { action: 'read', subject: 'project' },
    { action: 'update', subject: 'project' },
    { action: 'delete', subject: 'project' },
    
    // Task permissions
    { action: 'create', subject: 'task' },
    { action: 'read', subject: 'task' },
    { action: 'update', subject: 'task' },
    { action: 'delete', subject: 'task' },
    { action: 'assign', subject: 'task' },
    
    // User management permissions
    { action: 'invite', subject: 'user' },
  ],
  
  member: [
    // Organization permissions
    { action: 'read', subject: 'organization' },
    
    // Project permissions
    { action: 'read', subject: 'project' },
    
    // Task permissions
    { action: 'create', subject: 'task' },
    { action: 'read', subject: 'task' },
    { action: 'update', subject: 'task' },
    { action: 'assign', subject: 'task' },
  ],
  
  guest: [
    // Organization permissions
    { action: 'read', subject: 'organization' },
    
    // Project permissions
    { action: 'read', subject: 'project' },
    
    // Task permissions
    { action: 'read', subject: 'task' },
  ],
};

/**
 * Check if a user has permission to perform an action on a subject
 */
export async function hasPermission(
  userId: number,
  organizationId: number,
  action: string,
  subject: string
): Promise<boolean> {
  try {
    // Get user's role in the organization
    const memberRecord = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (!memberRecord.length) {
      return false; // User is not a member of the organization
    }
    
    const userRole = memberRecord[0].role as Role;
    
    // Check if the user's role has the required permission
    return rolePermissions[userRole].some(
      (permission) => permission.action === action && permission.subject === subject
    );
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Get all permissions for a specific role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a user is an organization owner
 */
export async function isOrganizationOwner(
  userId: number,
  organizationId: number
): Promise<boolean> {
  try {
    const memberRecord = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.role, 'owner')
        )
      )
      .limit(1);
    
    return memberRecord.length > 0;
  } catch (error) {
    console.error('Owner check error:', error);
    return false;
  }
}

/**
 * Get user's role in an organization
 */
export async function getUserRole(
  userId: number,
  organizationId: number
): Promise<Role | null> {
  try {
    const memberRecord = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (!memberRecord.length) {
      return null;
    }
    
    return memberRecord[0].role as Role;
  } catch (error) {
    console.error('Get user role error:', error);
    return null;
  }
} 