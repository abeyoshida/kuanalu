'use server';

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { 
  projects, 
  projectMembers, 
  projectCategories, 
  projectCategoryAssignments,
  users,
  tasks
} from "@/lib/db/schema";
import { and, eq, count, isNull, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { 
  ProjectWithMeta, 
  ProjectMemberInput,
  ProjectCategoryInput
} from "@/types/project";
import { hasPermission } from "@/lib/auth/permissions";

/**
 * Create a new project
 */
export async function createProject(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to create a project");
  }
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const organizationId = parseInt(formData.get('organizationId') as string);
  const status = formData.get('status') as 'planning' | 'active' | 'on_hold' | 'completed' | 'canceled' || 'planning';
  const visibility = formData.get('visibility') as 'public' | 'private' | 'team_only' || 'private';
  const startDate = formData.get('startDate') ? new Date(formData.get('startDate') as string) : null;
  const targetDate = formData.get('targetDate') ? new Date(formData.get('targetDate') as string) : null;
  const icon = formData.get('icon') as string;
  const color = formData.get('color') as string;
  
  if (!name || name.trim() === '') {
    throw new Error("Project name is required");
  }
  
  if (!organizationId || isNaN(organizationId)) {
    throw new Error("Organization ID is required");
  }
  
  const userId = parseInt(session.user.id);
  
  // Check if user has permission to create a project in this organization
  const hasCreatePermission = await hasPermission(
    userId,
    organizationId,
    'create',
    'project'
  );
  
  if (!hasCreatePermission) {
    throw new Error("You don't have permission to create a project in this organization");
  }
  
  try {
    // Generate a slug from the name
    const slug = name.trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars except whitespace and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    
    // Begin transaction
    const result = await db.transaction(async (tx) => {
      // Create the project
      const [newProject] = await tx
        .insert(projects)
        .values({
          name: name.trim(),
          slug,
          description: description ? description.trim() : null,
          status,
          visibility,
          organizationId,
          ownerId: userId,
          startDate,
          targetDate,
          icon: icon || null,
          color: color || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      // Add the current user as owner
      await tx
        .insert(projectMembers)
        .values({
          userId,
          projectId: newProject.id,
          role: 'owner',
          addedBy: userId,
          joinedAt: new Date(),
          createdAt: new Date()
        });
      
      return newProject;
    });
    
    revalidatePath(`/organizations/${organizationId}/projects`);
    
    // Redirect to the new project page
    return redirect(`/projects/${result.id}`);
  } catch (error) {
    console.error('Failed to create project:', error);
    throw new Error("Failed to create project");
  }
}

/**
 * Get all projects for an organization
 */
export async function getOrganizationProjects(organizationId: number): Promise<ProjectWithMeta[]> {
  const session = await auth();
  
  if (!session?.user) {
    return [];
  }
  
  try {
    // Check if user is a member of the organization
    const isMember = await db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, organizationId))
      .limit(1);
    
    if (!isMember.length) {
      throw new Error("You don't have access to this organization's projects");
    }
    
    // Get all projects for the organization
    const projectsList = await db
      .select({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
        description: projects.description,
        status: projects.status,
        visibility: projects.visibility,
        organizationId: projects.organizationId,
        ownerId: projects.ownerId,
        startDate: projects.startDate,
        targetDate: projects.targetDate,
        completedDate: projects.completedDate,
        icon: projects.icon,
        color: projects.color,
        metadata: projects.metadata,
        settings: projects.settings,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        archivedAt: projects.archivedAt,
        ownerName: users.name
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .where(
        and(
          eq(projects.organizationId, organizationId),
          isNull(projects.archivedAt)
        )
      )
      .orderBy(desc(projects.updatedAt));
    
    // Get member and task counts for each project
    const projectsWithMeta = await Promise.all(
      projectsList.map(async (project) => {
        const [memberResult] = await db
          .select({ count: count() })
          .from(projectMembers)
          .where(eq(projectMembers.projectId, project.id));
        
        const [taskResult] = await db
          .select({ count: count() })
          .from(tasks)
          .where(eq(tasks.projectId, project.id));
        
        // Get project categories
        const categoryResults = await db
          .select({
            id: projectCategories.id,
            name: projectCategories.name,
            description: projectCategories.description,
            color: projectCategories.color,
            organizationId: projectCategories.organizationId,
            createdBy: projectCategories.createdBy,
            createdAt: projectCategories.createdAt,
            updatedAt: projectCategories.updatedAt
          })
          .from(projectCategoryAssignments)
          .innerJoin(
            projectCategories,
            eq(projectCategoryAssignments.categoryId, projectCategories.id)
          )
          .where(eq(projectCategoryAssignments.projectId, project.id));
        
        return {
          ...project,
          memberCount: Number(memberResult.count),
          taskCount: Number(taskResult.count),
          categories: categoryResults,
          ownerName: project.ownerName || undefined
        };
      })
    );
    
    return projectsWithMeta;
  } catch (error) {
    console.error('Failed to get organization projects:', error);
    return [];
  }
}

/**
 * Get project by ID
 */
export async function getProjectById(projectId: number): Promise<ProjectWithMeta | null> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to view project details");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Check if user is a member of the project
    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, projectId)
        )
      )
      .limit(1);
    
    // If not a direct member, check if the project is public or if user is an org admin
    if (!membership.length) {
      const project = await db
        .select({
          visibility: projects.visibility,
          organizationId: projects.organizationId
        })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)
        .then((results) => results[0]);
      
      if (!project) {
        throw new Error("Project not found");
      }
      
      if (project.visibility !== 'public') {
        // Check if user is an org admin
        const isOrgAdmin = await db
          .select()
          .from(projects)
          .innerJoin(
            projectMembers,
            eq(projects.organizationId, projectMembers.projectId)
          )
          .where(
            and(
              eq(projects.id, projectId),
              eq(projectMembers.userId, userId),
              eq(projectMembers.role, 'admin')
            )
          )
          .limit(1);
        
        if (!isOrgAdmin.length) {
          throw new Error("You don't have access to this project");
        }
      }
    }
    
    // Get project details
    const project = await db
      .select({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
        description: projects.description,
        status: projects.status,
        visibility: projects.visibility,
        organizationId: projects.organizationId,
        ownerId: projects.ownerId,
        startDate: projects.startDate,
        targetDate: projects.targetDate,
        completedDate: projects.completedDate,
        icon: projects.icon,
        color: projects.color,
        metadata: projects.metadata,
        settings: projects.settings,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        archivedAt: projects.archivedAt,
        ownerName: users.name
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .where(eq(projects.id, projectId))
      .limit(1)
      .then((results) => results[0] || null);
    
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Get member count
    const [memberResult] = await db
      .select({ count: count() })
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
    
    // Get task count
    const [taskResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(eq(tasks.projectId, projectId));
    
    // Get project categories
    const categories = await db
      .select({
        id: projectCategories.id,
        name: projectCategories.name,
        description: projectCategories.description,
        color: projectCategories.color,
        organizationId: projectCategories.organizationId,
        createdBy: projectCategories.createdBy,
        createdAt: projectCategories.createdAt,
        updatedAt: projectCategories.updatedAt
      })
      .from(projectCategoryAssignments)
      .innerJoin(
        projectCategories,
        eq(projectCategoryAssignments.categoryId, projectCategories.id)
      )
      .where(eq(projectCategoryAssignments.projectId, projectId));
    
    return {
      ...project,
      memberCount: Number(memberResult.count),
      taskCount: Number(taskResult.count),
      categories,
      ownerName: project.ownerName || undefined
    };
  } catch (error) {
    console.error('Failed to get project details:', error);
    throw error;
  }
}

/**
 * Update project details
 */
export async function updateProject(projectId: number, formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to update a project");
  }
  
  const userId = parseInt(session.user.id);
  
  // Extract form data
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as 'planning' | 'active' | 'on_hold' | 'completed' | 'canceled';
  const visibility = formData.get('visibility') as 'public' | 'private' | 'team_only';
  const startDate = formData.get('startDate') ? new Date(formData.get('startDate') as string) : null;
  const targetDate = formData.get('targetDate') ? new Date(formData.get('targetDate') as string) : null;
  const completedDate = formData.get('completedDate') ? new Date(formData.get('completedDate') as string) : null;
  const icon = formData.get('icon') as string;
  const color = formData.get('color') as string;
  const archived = formData.get('archived') === 'true';
  
  if (!name || name.trim() === '') {
    throw new Error("Project name is required");
  }
  
  try {
    // Check if user has permission to update the project
    const project = await db
      .select({
        organizationId: projects.organizationId
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
      .then((results) => results[0]);
    
    if (!project) {
      throw new Error("Project not found");
    }
    
    const hasUpdatePermission = await hasPermission(
      userId,
      project.organizationId,
      'update',
      'project'
    );
    
    if (!hasUpdatePermission) {
      throw new Error("You don't have permission to update this project");
    }
    
    // Update the project
    await db
      .update(projects)
      .set({
        name: name.trim(),
        description: description ? description.trim() : null,
        status: status || undefined,
        visibility: visibility || undefined,
        startDate,
        targetDate,
        completedDate,
        icon: icon || null,
        color: color || null,
        archivedAt: archived ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(projects.id, projectId));
    
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/organizations/${project.organizationId}/projects`);
  } catch (error) {
    console.error('Failed to update project:', error);
    throw error;
  }
}

/**
 * Add a member to a project
 */
export async function addProjectMember(input: ProjectMemberInput) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to add a project member");
  }
  
  const currentUserId = parseInt(session.user.id);
  
  try {
    // Check if user has permission to add members to the project
    const project = await db
      .select({
        organizationId: projects.organizationId
      })
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1)
      .then((results) => results[0]);
    
    if (!project) {
      throw new Error("Project not found");
    }
    
    const hasManagePermission = await hasPermission(
      currentUserId,
      project.organizationId,
      'manage',
      'project'
    );
    
    if (!hasManagePermission) {
      throw new Error("You don't have permission to add members to this project");
    }
    
    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, input.userId),
          eq(projectMembers.projectId, input.projectId)
        )
      )
      .limit(1);
    
    if (existingMember.length) {
      // Update role if user is already a member
      await db
        .update(projectMembers)
        .set({
          role: input.role
        })
        .where(
          and(
            eq(projectMembers.userId, input.userId),
            eq(projectMembers.projectId, input.projectId)
          )
        );
    } else {
      // Add user as a member
      await db
        .insert(projectMembers)
        .values({
          userId: input.userId,
          projectId: input.projectId,
          role: input.role,
          addedBy: currentUserId,
          joinedAt: new Date(),
          createdAt: new Date()
        });
    }
    
    revalidatePath(`/projects/${input.projectId}`);
  } catch (error) {
    console.error('Failed to add project member:', error);
    throw error;
  }
}

/**
 * Remove a member from a project
 */
export async function removeProjectMember(projectId: number, userId: number) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to remove a project member");
  }
  
  const currentUserId = parseInt(session.user.id);
  
  try {
    // Check if user has permission to remove members from the project
    const project = await db
      .select({
        organizationId: projects.organizationId,
        ownerId: projects.ownerId
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
      .then((results) => results[0]);
    
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Cannot remove the project owner
    if (userId === project.ownerId) {
      throw new Error("Cannot remove the project owner");
    }
    
    const hasManagePermission = await hasPermission(
      currentUserId,
      project.organizationId,
      'manage',
      'project'
    );
    
    if (!hasManagePermission && currentUserId !== userId) {
      throw new Error("You don't have permission to remove members from this project");
    }
    
    // Remove user from project
    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, projectId)
        )
      );
    
    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    console.error('Failed to remove project member:', error);
    throw error;
  }
}

/**
 * Get project members
 */
export async function getProjectMembers(projectId: number) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to view project members");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Check if user has access to the project
    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, projectId)
        )
      )
      .limit(1);
    
    if (!membership.length) {
      // Check if project is public
      const project = await db
        .select({
          visibility: projects.visibility
        })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)
        .then((results) => results[0]);
      
      if (!project || project.visibility !== 'public') {
        throw new Error("You don't have access to this project");
      }
    }
    
    // Get all members with their user details
    const members = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: projectMembers.role,
        joinedAt: projectMembers.joinedAt
      })
      .from(projectMembers)
      .innerJoin(
        users,
        eq(projectMembers.userId, users.id)
      )
      .where(eq(projectMembers.projectId, projectId));
    
    return members;
  } catch (error) {
    console.error('Failed to get project members:', error);
    throw error;
  }
}

/**
 * Create a project category
 */
export async function createProjectCategory(input: ProjectCategoryInput) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to create a project category");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Check if user has permission to create categories in this organization
    const hasManagePermission = await hasPermission(
      userId,
      input.organizationId,
      'manage',
      'organization'
    );
    
    if (!hasManagePermission) {
      throw new Error("You don't have permission to create categories in this organization");
    }
    
    // Create the category
    const [category] = await db
      .insert(projectCategories)
      .values({
        name: input.name,
        description: input.description || null,
        color: input.color || null,
        organizationId: input.organizationId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    revalidatePath(`/organizations/${input.organizationId}/settings`);
    
    return category;
  } catch (error) {
    console.error('Failed to create project category:', error);
    throw error;
  }
}

/**
 * Assign a category to a project
 */
export async function assignCategoryToProject(projectId: number, categoryId: number) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to assign a category to a project");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Check if user has permission to update the project
    const project = await db
      .select({
        organizationId: projects.organizationId
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
      .then((results) => results[0]);
    
    if (!project) {
      throw new Error("Project not found");
    }
    
    const hasUpdatePermission = await hasPermission(
      userId,
      project.organizationId,
      'update',
      'project'
    );
    
    if (!hasUpdatePermission) {
      throw new Error("You don't have permission to update this project");
    }
    
    // Check if category belongs to the same organization
    const category = await db
      .select()
      .from(projectCategories)
      .where(
        and(
          eq(projectCategories.id, categoryId),
          eq(projectCategories.organizationId, project.organizationId)
        )
      )
      .limit(1);
    
    if (!category.length) {
      throw new Error("Category not found or doesn't belong to the same organization");
    }
    
    // Check if assignment already exists
    const existingAssignment = await db
      .select()
      .from(projectCategoryAssignments)
      .where(
        and(
          eq(projectCategoryAssignments.projectId, projectId),
          eq(projectCategoryAssignments.categoryId, categoryId)
        )
      )
      .limit(1);
    
    if (!existingAssignment.length) {
      // Create the assignment
      await db
        .insert(projectCategoryAssignments)
        .values({
          projectId,
          categoryId,
          assignedBy: userId,
          createdAt: new Date()
        });
    }
    
    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    console.error('Failed to assign category to project:', error);
    throw error;
  }
}

/**
 * Remove a category from a project
 */
export async function removeCategoryFromProject(projectId: number, categoryId: number) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to remove a category from a project");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Check if user has permission to update the project
    const project = await db
      .select({
        organizationId: projects.organizationId
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
      .then((results) => results[0]);
    
    if (!project) {
      throw new Error("Project not found");
    }
    
    const hasUpdatePermission = await hasPermission(
      userId,
      project.organizationId,
      'update',
      'project'
    );
    
    if (!hasUpdatePermission) {
      throw new Error("You don't have permission to update this project");
    }
    
    // Remove the assignment
    await db
      .delete(projectCategoryAssignments)
      .where(
        and(
          eq(projectCategoryAssignments.projectId, projectId),
          eq(projectCategoryAssignments.categoryId, categoryId)
        )
      );
    
    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    console.error('Failed to remove category from project:', error);
    throw error;
  }
} 