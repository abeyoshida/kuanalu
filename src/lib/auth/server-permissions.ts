'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { db } from "../db";
import { users, organizationMembers, rolePermissions as rolePermissionsTable } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { Role } from './permissions-data';

/**
 * Server component utility to check permissions
 * If the user doesn't have permission, redirects to the specified path
 */
export async function checkPermission(
  organizationId: number,
  action: string,
  subject: string,
  redirectPath: string = '/dashboard'
): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  const userId = parseInt(session.user.id);
  const permitted = await hasPermission(userId, organizationId, action, subject);
  
  if (!permitted) {
    redirect(redirectPath);
  }
  
  return true;
}

/**
 * Server component utility to check if the current user has the specified permission
 * Returns boolean without redirecting
 */
export async function userHasPermission(
  organizationId: number,
  action: string,
  subject: string
): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user) {
    return false;
  }
  
  const userId = parseInt(session.user.id);
  return await hasPermission(userId, organizationId, action, subject);
}

/**
 * Check if a user has permission to perform an action on a subject
 * Server-side only function
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
      console.log('No membership found for user', userId, 'in organization', organizationId);
      return false; // User is not a member of the organization
    }
    
    const userRole = memberRecord[0].role as Role;
    console.log('User role:', userRole);
    
    // Check the role_permissions table for this role, action, and subject
    const permissionRecord = await db
      .select({
        granted: rolePermissionsTable.granted
      })
      .from(rolePermissionsTable)
      .where(
        and(
          eq(rolePermissionsTable.role, userRole),
          eq(rolePermissionsTable.resource, subject),
          eq(rolePermissionsTable.action, action)
        )
      )
      .limit(1);
    
    // If we found a permission record, use that
    if (permissionRecord.length > 0) {
      return permissionRecord[0].granted;
    }
    
    // If no permission record exists, default to false (no permission)
    console.log(`No permission record found for role ${userRole}, action ${action}, subject ${subject}`);
    return false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Check if a user has all of the specified permissions
 * Server-side only function
 */
export async function hasMultiplePermissions(
  userId: number,
  organizationId: number,
  permissions: Array<{ action: string, subject: string }>
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
    
    // Check each permission individually
    for (const { action, subject } of permissions) {
      const permissionRecord = await db
        .select({
          granted: rolePermissionsTable.granted
        })
        .from(rolePermissionsTable)
        .where(
          and(
            eq(rolePermissionsTable.role, userRole),
            eq(rolePermissionsTable.resource, subject),
            eq(rolePermissionsTable.action, action)
          )
        )
        .limit(1);
      
      // If any permission is not granted, return false
      if (!permissionRecord.length || !permissionRecord[0].granted) {
        return false;
      }
    }
    
    // All permissions are granted
    return true;
  } catch (error) {
    console.error('Multiple permissions check error:', error);
    return false;
  }
}

/**
 * Check if a user has any of the specified permissions
 * Server-side only function
 */
export async function hasAnyPermission(
  userId: number,
  organizationId: number,
  permissions: Array<{ action: string, subject: string }>
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
    
    // Check each permission individually
    for (const { action, subject } of permissions) {
      const permissionRecord = await db
        .select({
          granted: rolePermissionsTable.granted
        })
        .from(rolePermissionsTable)
        .where(
          and(
            eq(rolePermissionsTable.role, userRole),
            eq(rolePermissionsTable.resource, subject),
            eq(rolePermissionsTable.action, action)
          )
        )
        .limit(1);
      
      // If any permission is granted, return true
      if (permissionRecord.length && permissionRecord[0].granted) {
        return true;
      }
    }
    
    // No permissions are granted
    return false;
  } catch (error) {
    console.error('Any permission check error:', error);
    return false;
  }
}

/**
 * Server component utility to check if the current user has all specified permissions
 * Returns boolean without redirecting
 */
export async function userHasMultiplePermissions(
  organizationId: number,
  permissions: Array<{ action: string, subject: string }>
): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user) {
    return false;
  }
  
  const userId = parseInt(session.user.id);
  return await hasMultiplePermissions(userId, organizationId, permissions);
}

/**
 * Server component utility to check if the current user has any of the specified permissions
 * Returns boolean without redirecting
 */
export async function userHasAnyPermission(
  organizationId: number,
  permissions: Array<{ action: string, subject: string }>
): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user) {
    return false;
  }
  
  const userId = parseInt(session.user.id);
  return await hasAnyPermission(userId, organizationId, permissions);
}

/**
 * Get a user's role in an organization
 */
export async function getUserRole(
  userId: number,
  organizationId: number
): Promise<Role | null> {
  try {
    const memberRecord = await db
      .select({
        role: organizationMembers.role
      })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (!memberRecord.length) {
      return null; // User is not a member of the organization
    }
    
    return memberRecord[0].role as Role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Server component utility to check if the current user has a specific role
 */
export async function userHasRole(
  organizationId: number,
  role: Role
): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user) {
    return false;
  }
  
  const userId = parseInt(session.user.id);
  const userRole = await getUserRole(userId, organizationId);
  
  return userRole === role;
}

/**
 * Check if a user is an organization owner
 * Server-side only function
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
 * Get the current user from the session
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return null;
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email));
    
    return user || null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
} 