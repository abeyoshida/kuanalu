'use server';

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { users, organizationMembers, organizations, userPermissions } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { SafeUser, UserPermissionInput, UserPreferences } from "@/types/user";
import bcrypt from 'bcrypt';

/**
 * Get the current user profile
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get user details
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        bio: users.bio,
        jobTitle: users.jobTitle,
        department: users.department,
        location: users.location,
        timezone: users.timezone,
        phoneNumber: users.phoneNumber,
        status: users.status,
        isAdmin: users.isAdmin,
        lastActive: users.lastActive,
        preferences: users.preferences,
        metadata: users.metadata,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((results) => results[0] || null);
    
    if (!user) {
      return null;
    }
    
    // Get user organizations
    const userOrgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        role: organizationMembers.role
      })
      .from(organizations)
      .innerJoin(
        organizationMembers,
        eq(organizations.id, organizationMembers.organizationId)
      )
      .where(eq(organizationMembers.userId, userId));
    
    return {
      ...user,
      organizations: userOrgs
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to update your profile");
  }
  
  const userId = parseInt(session.user.id);
  
  // Extract form data
  const name = formData.get('name') as string;
  const bio = formData.get('bio') as string;
  const jobTitle = formData.get('jobTitle') as string;
  const department = formData.get('department') as string;
  const location = formData.get('location') as string;
  const timezone = formData.get('timezone') as string;
  const phoneNumber = formData.get('phoneNumber') as string;
  
  if (!name || name.trim() === '') {
    throw new Error("Name is required");
  }
  
  try {
    // Update user profile
    await db
      .update(users)
      .set({
        name: name.trim(),
        bio: bio || null,
        jobTitle: jobTitle || null,
        department: department || null,
        location: location || null,
        timezone: timezone || null,
        phoneNumber: phoneNumber || null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    revalidatePath('/profile');
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw new Error("Failed to update user profile");
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to update your password");
  }
  
  const userId = parseInt(session.user.id);
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error("All password fields are required");
  }
  
  if (newPassword !== confirmPassword) {
    throw new Error("New passwords do not match");
  }
  
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  
  try {
    // Get current user with password
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((results) => results[0]);
    
    if (!user?.password) {
      throw new Error("Cannot update password for accounts without a password");
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    revalidatePath('/profile');
  } catch (error) {
    console.error('Failed to update password:', error);
    throw error;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(preferences: UserPreferences) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to update your preferences");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Update user preferences
    await db
      .update(users)
      .set({
        preferences,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    revalidatePath('/profile');
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    throw new Error("Failed to update user preferences");
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number): Promise<SafeUser | null> {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }
  
  try {
    // Get user details
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        bio: users.bio,
        jobTitle: users.jobTitle,
        department: users.department,
        location: users.location,
        timezone: users.timezone,
        phoneNumber: users.phoneNumber,
        status: users.status,
        isAdmin: users.isAdmin,
        lastActive: users.lastActive,
        preferences: users.preferences,
        metadata: users.metadata,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((results) => results[0] || null);
    
    if (!user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error(`Failed to get user with ID ${userId}:`, error);
    return null;
  }
}

/**
 * Set user permission
 */
export async function setUserPermission(permission: UserPermissionInput) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to set user permissions");
  }
  
  const currentUserId = parseInt(session.user.id);
  
  // Check if current user is an admin
  const currentUser = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, currentUserId))
    .limit(1)
    .then((results) => results[0]);
  
  if (!currentUser?.isAdmin) {
    throw new Error("You don't have permission to set user permissions");
  }
  
  try {
    // Build conditions for finding existing permission
    const conditions = [
      eq(userPermissions.userId, permission.userId),
      eq(userPermissions.resource, permission.resource),
      eq(userPermissions.action, permission.action)
    ];
    
    // Add organization condition
    if (permission.organizationId) {
      conditions.push(eq(userPermissions.organizationId, permission.organizationId));
    } else {
      conditions.push(isNull(userPermissions.organizationId));
    }
    
    // Add project condition
    if (permission.projectId) {
      conditions.push(eq(userPermissions.projectId, permission.projectId));
    } else {
      conditions.push(isNull(userPermissions.projectId));
    }
    
    // Check if permission already exists
    const existingPermission = await db
      .select()
      .from(userPermissions)
      .where(and(...conditions))
      .limit(1)
      .then((results) => results[0]);
    
    if (existingPermission) {
      // Update existing permission
      await db
        .update(userPermissions)
        .set({
          granted: permission.granted,
          updatedAt: new Date()
        })
        .where(eq(userPermissions.id, existingPermission.id));
    } else {
      // Create new permission
      await db
        .insert(userPermissions)
        .values({
          userId: permission.userId,
          organizationId: permission.organizationId || null,
          projectId: permission.projectId || null,
          resource: permission.resource,
          action: permission.action,
          granted: permission.granted,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
    
    revalidatePath('/admin/users');
  } catch (error) {
    console.error('Failed to set user permission:', error);
    throw new Error("Failed to set user permission");
  }
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId: number) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to view user permissions");
  }
  
  const currentUserId = parseInt(session.user.id);
  
  // Check if current user is an admin or the user themselves
  if (currentUserId !== userId) {
    const currentUser = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1)
      .then((results) => results[0]);
    
    if (!currentUser?.isAdmin) {
      throw new Error("You don't have permission to view user permissions");
    }
  }
  
  try {
    // Get user permissions
    const permissions = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));
    
    return permissions;
  } catch (error) {
    console.error('Failed to get user permissions:', error);
    throw new Error("Failed to get user permissions");
  }
}

/**
 * Update user status
 */
export async function updateUserStatus(userId: number, status: 'active' | 'inactive' | 'suspended' | 'pending') {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to update user status");
  }
  
  const currentUserId = parseInt(session.user.id);
  
  // Check if current user is an admin
  const currentUser = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, currentUserId))
    .limit(1)
    .then((results) => results[0]);
  
  if (!currentUser?.isAdmin) {
    throw new Error("You don't have permission to update user status");
  }
  
  try {
    // Update user status
    await db
      .update(users)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    revalidatePath('/admin/users');
  } catch (error) {
    console.error('Failed to update user status:', error);
    throw new Error("Failed to update user status");
  }
} 