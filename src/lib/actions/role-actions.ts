'use server';

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organizationMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission, Role } from "@/lib/auth/permissions";

interface UpdateRoleResult {
  success: boolean;
  message: string;
}

/**
 * Server action to update a user's role in an organization
 */
export async function updateUserRole(
  userId: number,
  organizationId: number,
  newRole: Role
): Promise<UpdateRoleResult> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return {
        success: false,
        message: "You must be logged in to perform this action",
      };
    }
    
    const currentUserId = parseInt(session.user.id);
    
    // Check if the current user has permission to update roles
    const canUpdateRoles = await hasPermission(
      currentUserId,
      organizationId,
      'update-role',
      'user'
    );
    
    if (!canUpdateRoles) {
      return {
        success: false,
        message: "You don't have permission to update user roles",
      };
    }
    
    // Check if the user is trying to update their own role
    if (currentUserId === userId) {
      return {
        success: false,
        message: "You cannot update your own role",
      };
    }
    
    // Update the user's role
    await db
      .update(organizationMembers)
      .set({
        role: newRole,
      })
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );
    
    // Revalidate the organization members page
    revalidatePath(`/organizations/${organizationId}/members`);
    
    return {
      success: true,
      message: "User role updated successfully",
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      message: "Failed to update user role",
    };
  }
}

/**
 * Server action to remove a user from an organization
 */
export async function removeUserFromOrganization(
  userId: number,
  organizationId: number
): Promise<UpdateRoleResult> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return {
        success: false,
        message: "You must be logged in to perform this action",
      };
    }
    
    const currentUserId = parseInt(session.user.id);
    
    // Check if the current user has permission to remove users
    const canRemoveUsers = await hasPermission(
      currentUserId,
      organizationId,
      'remove',
      'user'
    );
    
    if (!canRemoveUsers) {
      return {
        success: false,
        message: "You don't have permission to remove users from this organization",
      };
    }
    
    // Check if the user is trying to remove themselves
    if (currentUserId === userId) {
      return {
        success: false,
        message: "You cannot remove yourself from the organization",
      };
    }
    
    // Remove the user from the organization
    await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );
    
    // Revalidate the organization members page
    revalidatePath(`/organizations/${organizationId}/members`);
    
    return {
      success: true,
      message: "User removed from organization successfully",
    };
  } catch (error) {
    console.error("Error removing user from organization:", error);
    return {
      success: false,
      message: "Failed to remove user from organization",
    };
  }
} 