import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { projects, tasks, comments, subtasks, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Session } from "next-auth";

/**
 * Validates that a user has permission to perform an action on a subject
 */
export async function validatePermission(
  userId: number,
  organizationId: number,
  action: string,
  subject: string
): Promise<NextResponse | null> {
  try {
    const hasAccess = await hasPermission(userId, organizationId, action, subject);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: `Permission denied. You don't have ${action} permission for ${subject}.` },
        { status: 403 }
      );
    }
    
    return null;
  } catch (error) {
    console.error('Permission validation error:', error);
    return NextResponse.json(
      { error: "Error checking permissions" },
      { status: 500 }
    );
  }
}

/**
 * Gets the organization ID for a project
 */
export async function getOrganizationIdFromProject(projectId: number): Promise<number> {
  const project = await db
    .select({ organizationId: projects.organizationId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  
  if (!project.length) {
    throw new Error("Project not found");
  }
  
  return project[0].organizationId;
}

/**
 * Gets the organization ID for a task
 */
export async function getOrganizationIdFromTask(taskId: number): Promise<number> {
  const task = await db
    .select({ projectId: tasks.projectId })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  
  if (!task.length) {
    throw new Error("Task not found");
  }
  
  return getOrganizationIdFromProject(task[0].projectId);
}

/**
 * Gets the organization ID for a subtask
 */
export async function getOrganizationIdFromSubtask(subtaskId: number): Promise<number> {
  const subtask = await db
    .select({ taskId: subtasks.taskId })
    .from(subtasks)
    .where(eq(subtasks.id, subtaskId))
    .limit(1);
  
  if (!subtask.length) {
    throw new Error("Subtask not found");
  }
  
  return getOrganizationIdFromTask(subtask[0].taskId);
}

/**
 * Gets the organization ID for a comment
 */
export async function getOrganizationIdFromComment(commentId: number): Promise<number> {
  const comment = await db
    .select({ taskId: comments.taskId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  
  if (!comment.length) {
    throw new Error("Comment not found");
  }
  
  return getOrganizationIdFromTask(comment[0].taskId);
}

/**
 * Validates project permissions
 */
export async function validateProjectPermission(
  session: Session | null,
  projectId: number,
  action: string
): Promise<NextResponse | null> {
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. You must be logged in to access this resource." },
      { status: 401 }
    );
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    const organizationId = await getOrganizationIdFromProject(projectId);
    return validatePermission(userId, organizationId, action, 'project');
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    console.error('Project permission validation error:', error);
    return NextResponse.json(
      { error: "Error checking project permissions" },
      { status: 500 }
    );
  }
}

/**
 * Validates task permissions
 */
export async function validateTaskPermission(
  session: Session | null,
  taskId: number,
  action: string
): Promise<NextResponse | null> {
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. You must be logged in to access this resource." },
      { status: 401 }
    );
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    const organizationId = await getOrganizationIdFromTask(taskId);
    return validatePermission(userId, organizationId, action, 'task');
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    console.error('Task permission validation error:', error);
    return NextResponse.json(
      { error: "Error checking task permissions" },
      { status: 500 }
    );
  }
}

/**
 * Validates subtask permissions
 */
export async function validateSubtaskPermission(
  session: Session | null,
  subtaskId: number,
  action: string
): Promise<NextResponse | null> {
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. You must be logged in to access this resource." },
      { status: 401 }
    );
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    const organizationId = await getOrganizationIdFromSubtask(subtaskId);
    return validatePermission(userId, organizationId, action, 'subtask');
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Subtask not found" },
        { status: 404 }
      );
    }
    
    console.error('Subtask permission validation error:', error);
    return NextResponse.json(
      { error: "Error checking subtask permissions" },
      { status: 500 }
    );
  }
}

/**
 * Validates comment permissions
 */
export async function validateCommentPermission(
  session: Session | null,
  commentId: number,
  action: string
): Promise<NextResponse | null> {
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. You must be logged in to access this resource." },
      { status: 401 }
    );
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    const organizationId = await getOrganizationIdFromComment(commentId);
    return validatePermission(userId, organizationId, action, 'comment');
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }
    
    console.error('Comment permission validation error:', error);
    return NextResponse.json(
      { error: "Error checking comment permissions" },
      { status: 500 }
    );
  }
}

/**
 * Validates organization permissions
 */
export async function validateOrganizationPermission(
  session: Session | null,
  organizationId: number,
  action: string
): Promise<NextResponse | null> {
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. You must be logged in to access this resource." },
      { status: 401 }
    );
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Check if organization exists
    const org = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);
    
    if (!org.length) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }
    
    return validatePermission(userId, organizationId, action, 'organization');
  } catch (error) {
    console.error('Organization permission validation error:', error);
    return NextResponse.json(
      { error: "Error checking organization permissions" },
      { status: 500 }
    );
  }
} 