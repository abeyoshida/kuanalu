'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { db } from "@/lib/db";
import { organizationMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { Role, Permission, rolePermissions } from './permissions-data';

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
    console.log('Available roles in rolePermissions:', Object.keys(rolePermissions));
    
    // Check if the role exists in rolePermissions
    if (!rolePermissions[userRole]) {
      console.error(`Role "${userRole}" not found in rolePermissions`);
      // Default to guest permissions if role is not found
      return rolePermissions['guest'].some(
        (permission: Permission) => permission.action === action && permission.subject === subject
      );
    }
    
    // Check if the user's role has the required permission
    return rolePermissions[userRole].some(
      (permission: Permission) => permission.action === action && permission.subject === subject
    );
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
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
 * Get user's role in an organization
 * Server-side only function
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