'use client';

// Re-export everything from permissions-data.ts
export * from './permissions-data';

// Define permission levels for different roles
export type Role = 'owner' | 'admin' | 'member' | 'guest';

export interface Permission {
  action: string;
  subject: string;
}

// Define permissions for each role
export const rolePermissions: Record<Role, Permission[]> = {
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
 * Client-side function to check if a role has a specific permission
 */
export function roleHasPermission(
  role: Role,
  action: string,
  subject: string
): boolean {
  if (!rolePermissions[role]) {
    console.error(`Role "${role}" not found in rolePermissions`);
    // Default to guest permissions if role is not found
    return rolePermissions['guest'].some(
      (permission) => permission.action === action && permission.subject === subject
    );
  }

  return rolePermissions[role].some(
    (permission) => permission.action === action && permission.subject === subject
  );
}

/**
 * Client-side function to check if a role has all of the specified permissions
 */
export function roleHasMultiplePermissions(
  role: Role,
  permissions: Array<{ action: string, subject: string }>
): boolean {
  if (!rolePermissions[role]) {
    console.error(`Role "${role}" not found in rolePermissions`);
    // Default to guest permissions if role is not found
    const guestPermissions = rolePermissions['guest'];
    return permissions.every(({ action, subject }) => 
      guestPermissions.some(
        (permission) => permission.action === action && permission.subject === subject
      )
    );
  }

  const rolePerms = rolePermissions[role];
  return permissions.every(({ action, subject }) => 
    rolePerms.some(
      (permission) => permission.action === action && permission.subject === subject
    )
  );
}

/**
 * Client-side function to check if a role has any of the specified permissions
 */
export function roleHasAnyPermission(
  role: Role,
  permissions: Array<{ action: string, subject: string }>
): boolean {
  if (!rolePermissions[role]) {
    console.error(`Role "${role}" not found in rolePermissions`);
    // Default to guest permissions if role is not found
    const guestPermissions = rolePermissions['guest'];
    return permissions.some(({ action, subject }) => 
      guestPermissions.some(
        (permission) => permission.action === action && permission.subject === subject
      )
    );
  }

  const rolePerms = rolePermissions[role];
  return permissions.some(({ action, subject }) => 
    rolePerms.some(
      (permission) => permission.action === action && permission.subject === subject
    )
  );
}

/**
 * Server action to check permission
 * This is a wrapper around the server-side hasPermission function
 */
export async function hasPermission(
  userId: number,
  organizationId: number,
  action: string,
  subject: string
): Promise<boolean> {
  try {
    // This will be implemented as a server action
    const response = await fetch('/api/auth/check-permission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        organizationId,
        action,
        subject,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.hasPermission;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Get all permissions for a specific role
 * This is a client-safe function that doesn't access the database
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Get all actions a role can perform on a specific subject
 * This is a client-safe function that doesn't access the database
 */
export function getActionsForRoleAndSubject(role: Role, subject: string): string[] {
  if (!rolePermissions[role]) {
    return [];
  }
  
  return rolePermissions[role]
    .filter(permission => permission.subject === subject)
    .map(permission => permission.action);
}

/**
 * Check if a role has a higher level than another role
 * Owner > Admin > Member > Guest
 */
export function isRoleHigherThan(role1: Role, role2: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    'owner': 4,
    'admin': 3,
    'member': 2,
    'guest': 1
  };
  
  return roleHierarchy[role1] > roleHierarchy[role2];
}

/**
 * Check if a role can manage another role
 * A role can manage roles with lower hierarchy
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  return isRoleHigherThan(managerRole, targetRole);
} 