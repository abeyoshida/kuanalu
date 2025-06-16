'use server';

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organizations, organizationMembers, users } from "@/lib/db/schema";
import { and, eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";

export interface OrganizationWithMemberCount {
  id: number;
  name: string;
  memberCount: number;
  userRole: string;
  createdAt: Date;
}

/**
 * Create a new organization
 */
export async function createOrganization(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to create an organization");
  }
  
  const name = formData.get('name') as string;
  
  if (!name || name.trim() === '') {
    throw new Error("Organization name is required");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Begin transaction
    const result = await db.transaction(async (tx) => {
      // Create the organization
      const [newOrg] = await tx
        .insert(organizations)
        .values({
          name: name.trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      // Add the current user as owner
      await tx
        .insert(organizationMembers)
        .values({
          userId,
          organizationId: newOrg.id,
          role: 'owner',
          createdAt: new Date(),
        });
      
      return newOrg;
    });
    
    revalidatePath('/organizations');
    
    // Redirect to the new organization page
    return redirect(`/organizations/${result.id}`);
  } catch (error) {
    console.error('Failed to create organization:', error);
    throw new Error("Failed to create organization");
  }
}

/**
 * Get all organizations for the current user
 */
export async function getUserOrganizations(): Promise<OrganizationWithMemberCount[]> {
  const session = await auth();
  
  if (!session?.user) {
    return [];
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get all organizations the user is a member of
    const userOrgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        createdAt: organizations.createdAt,
        role: organizationMembers.role,
      })
      .from(organizations)
      .innerJoin(
        organizationMembers,
        eq(organizations.id, organizationMembers.organizationId)
      )
      .where(eq(organizationMembers.userId, userId));
    
    // Get member count for each organization
    const orgsWithMemberCount = await Promise.all(
      userOrgs.map(async (org) => {
        const [result] = await db
          .select({ count: count() })
          .from(organizationMembers)
          .where(eq(organizationMembers.organizationId, org.id));
        
        return {
          id: org.id,
          name: org.name,
          memberCount: Number(result.count),
          userRole: org.role,
          createdAt: org.createdAt,
        };
      })
    );
    
    return orgsWithMemberCount;
  } catch (error) {
    console.error('Failed to get user organizations:', error);
    return [];
  }
}

/**
 * Get organization details by ID
 */
export async function getOrganizationById(orgId: number) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to view organization details");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Check if user is a member of the organization
    const membership = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, orgId)
        )
      )
      .limit(1);
    
    if (!membership.length) {
      throw new Error("You don't have access to this organization");
    }
    
    // Get organization details
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1)
      .then((results) => results[0]);
    
    if (!org) {
      throw new Error("Organization not found");
    }
    
    return org;
  } catch (error) {
    console.error('Failed to get organization details:', error);
    throw new Error("Failed to get organization details");
  }
}

/**
 * Update organization details
 */
export async function updateOrganization(orgId: number, formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to update an organization");
  }
  
  const userId = parseInt(session.user.id);
  const name = formData.get('name') as string;
  
  if (!name || name.trim() === '') {
    throw new Error("Organization name is required");
  }
  
  try {
    // Check if user has permission to update the organization
    const hasUpdatePermission = await hasPermission(
      userId,
      orgId,
      'update',
      'organization'
    );
    
    if (!hasUpdatePermission) {
      throw new Error("You don't have permission to update this organization");
    }
    
    // Update the organization
    await db
      .update(organizations)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));
    
    revalidatePath(`/organizations/${orgId}`);
    revalidatePath('/organizations');
  } catch (error) {
    console.error('Failed to update organization:', error);
    throw new Error("Failed to update organization");
  }
}

/**
 * Delete an organization
 */
export async function deleteOrganization(orgId: number) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to delete an organization");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Check if user is the owner of the organization
    const isOwner = await hasPermission(
      userId,
      orgId,
      'delete',
      'organization'
    );
    
    if (!isOwner) {
      throw new Error("Only the organization owner can delete it");
    }
    
    // Delete the organization (cascade will handle members and projects)
    await db
      .delete(organizations)
      .where(eq(organizations.id, orgId));
    
    revalidatePath('/organizations');
    
    // Redirect to organizations list
    return redirect('/organizations');
  } catch (error) {
    console.error('Failed to delete organization:', error);
    throw new Error("Failed to delete organization");
  }
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(orgId: number) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to view organization members");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Check if user is a member of the organization
    const membership = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, orgId)
        )
      )
      .limit(1);
    
    if (!membership.length) {
      throw new Error("You don't have access to this organization");
    }
    
    // Get all members with their user details
    const members = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: organizationMembers.role,
        joinedAt: organizationMembers.createdAt,
      })
      .from(organizationMembers)
      .innerJoin(
        users,
        eq(organizationMembers.userId, users.id)
      )
      .where(eq(organizationMembers.organizationId, orgId));
    
    return members;
  } catch (error) {
    console.error('Failed to get organization members:', error);
    throw new Error("Failed to get organization members");
  }
} 