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
    
    // Subtask permissions
    { action: 'create', subject: 'subtask' },
    { action: 'read', subject: 'subtask' },
    { action: 'update', subject: 'subtask' },
    { action: 'delete', subject: 'subtask' },
    
    // Comment permissions
    { action: 'create', subject: 'comment' },
    { action: 'read', subject: 'comment' },
    { action: 'update', subject: 'comment' },
    { action: 'delete', subject: 'comment' },
    
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
    
    // Subtask permissions
    { action: 'create', subject: 'subtask' },
    { action: 'read', subject: 'subtask' },
    { action: 'update', subject: 'subtask' },
    { action: 'delete', subject: 'subtask' },
    
    // Comment permissions
    { action: 'create', subject: 'comment' },
    { action: 'read', subject: 'comment' },
    { action: 'update', subject: 'comment' },
    { action: 'delete', subject: 'comment' },
    
    // User management permissions
    { action: 'invite', subject: 'user' },
  ],
  
  member: [
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
    
    // Subtask permissions
    { action: 'create', subject: 'subtask' },
    { action: 'read', subject: 'subtask' },
    { action: 'update', subject: 'subtask' },
    { action: 'delete', subject: 'subtask' },
    
    // Comment permissions
    { action: 'create', subject: 'comment' },
    { action: 'read', subject: 'comment' },
    { action: 'update', subject: 'comment' },
    { action: 'delete', subject: 'comment' },
    
    // User management permissions
    { action: 'invite', subject: 'user' },
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
 * Get all permissions for a specific role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return rolePermissions[role] || [];
} 