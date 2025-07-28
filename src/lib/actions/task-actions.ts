'use server';

// Re-enabling imports now that caching issue is resolved
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import {
  tasks, 
  users, 
  projects, 
  projectMembers,
  subtasks,
  comments
} from "@/lib/db/schema";
import { and, eq, isNull, count, inArray, sql, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { 
  TaskWithMeta, 
  CreateTaskInput, 
  TaskFilterOptions,
  TaskStatus,
  TaskPriority,
  TaskType
} from "@/types/task";
import { hasPermission } from "@/lib/auth/permissions";
import { updateMultipleEntities } from "@/lib/db/sequential-ops";
import { handleActionError } from "@/lib/utils";

/**
 * Get all tasks for a project
 */
export async function getProjectTasks(
  projectId: number, 
  filters?: TaskFilterOptions
): Promise<TaskWithMeta[]> {
  console.log('🔥 getProjectTasks called with projectId:', projectId);
  
  try {
    // Step 1: Auth check (working)
    const session = await auth();
    if (!session?.user) {
      throw new Error("You must be logged in to view tasks");
    }
    
    const userId = parseInt(session.user.id);
    console.log('✅ Auth check passed for user:', userId);

    // Step 2: Permission check - ensure user has access to this project
    console.log('🔒 Checking project access permissions...');
    
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
    
    const isProjectMember = membership.length > 0;
    
    // If not a project member, check if project is public or if user has organization-level permissions
    if (!isProjectMember) {
      console.log('👀 User not a project member, checking organization permissions...');
      
      // Get the project and its organization
      const project = await db
        .select({
          visibility: projects.visibility,
          organizationId: projects.organizationId
        })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
      
      if (!project.length) {
        throw new Error("Project not found");
      }
      
      // Check if user has organization-level permissions
      const hasViewPermission = await hasPermission(
        userId,
        project[0].organizationId,
        'read',
        'task'
      );
      
      // If user doesn't have org-level permissions and project is not public, deny access
      if (!hasViewPermission && project[0].visibility !== 'public') {
        throw new Error("You don't have access to this project's tasks");
      }
      
      console.log('✅ Organization-level permission granted');
    } else {
      console.log('✅ Project member access granted');
    }

    // Step 3: Database query (working)
    console.log('🔍 Fetching tasks from database...');
    
    const tasksList = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        type: tasks.type,
        projectId: tasks.projectId,
        assigneeId: tasks.assigneeId,
        reporterId: tasks.reporterId,
        parentTaskId: tasks.parentTaskId,
        dueDate: tasks.dueDate,
        startDate: tasks.startDate,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        points: tasks.points,
        position: tasks.position,
        labels: tasks.labels,
        metadata: tasks.metadata,
        completedAt: tasks.completedAt,
        createdBy: tasks.createdBy,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        archivedAt: tasks.archivedAt,
        assigneeName: users.name
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(
        and(
          eq(tasks.projectId, projectId),
          isNull(tasks.archivedAt) // Exclude archived tasks
        )
      )
      .orderBy(asc(tasks.position));

    console.log(`✅ Found ${tasksList.length} tasks in database`);

    // Step 4: Add metadata to tasks
    console.log('📊 Adding metadata (subtasks, comments, etc.)...');
    
    const tasksWithMeta = await Promise.all(
      tasksList.map(async (task) => {
        try {
          // Get subtask count
          const [subtaskResult] = await db
            .select({ count: count() })
            .from(subtasks)
            .where(eq(subtasks.taskId, task.id));
          
          // Get comment count
          const [commentResult] = await db
            .select({ count: count() })
            .from(comments)
            .where(eq(comments.taskId, task.id));
          
          // Get child task count
          const [childTaskResult] = await db
            .select({ count: count() })
            .from(tasks)
            .where(
              and(
                eq(tasks.parentTaskId, task.id),
                isNull(tasks.archivedAt)
              )
            );
          
          // Get reporter name if exists
          const reporter = task.reporterId ? await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, task.reporterId))
            .limit(1)
            .then(results => results[0] || null) : null;
          
          // Check if task is overdue
          const isOverdue = task.dueDate && task.status !== 'done' && 
            new Date(task.dueDate) < new Date() && !task.completedAt;
          
          return {
            ...task,
            assigneeName: task.assigneeName || undefined,
            reporterName: reporter?.name || undefined,
            subtaskCount: Number(subtaskResult.count),
            commentCount: Number(commentResult.count),
            childTaskCount: Number(childTaskResult.count),
            isOverdue: isOverdue || false
          } as TaskWithMeta;
        } catch (metaError) {
          console.warn(`⚠️ Failed to get metadata for task ${task.id}:`, metaError);
          // Return task without metadata rather than failing completely
          return {
            ...task,
            assigneeName: task.assigneeName || undefined,
            reporterName: undefined,
            subtaskCount: 0,
            commentCount: 0,
            childTaskCount: 0,
            isOverdue: false
          } as TaskWithMeta;
        }
      })
    );

    console.log('✅ Tasks converted to TaskWithMeta format with full metadata');
    
    return tasksWithMeta;
  } catch (error) {
    console.error('❌ Failed to get project tasks:', error);
    throw error;
  }
}

// Test function to see if server actions work at all
export async function testServerAction(): Promise<string> {
  console.log('testServerAction called');
  return "Server action works!";
}

// Placeholder functions to maintain exports (all commented out logic)
export async function getTaskById(taskId: number): Promise<TaskWithMeta | null> {
  // TODO: Restore full implementation
  return null;
}

export async function createTask(input: CreateTaskInput): Promise<TaskWithMeta> {
  // TODO: Restore full implementation  
  throw new Error("Function temporarily disabled - will be restored soon");
}

export async function updateTask(taskId: number, data: any): Promise<any> {
  // TODO: Restore full implementation
  throw new Error("Function temporarily disabled - will be restored soon");
}

export async function deleteTask(taskId: number): Promise<void> {
  // TODO: Restore full implementation
  throw new Error("Function temporarily disabled - will be restored soon");
}

export async function updateTaskPositions(taskId: number, newStatus: string, newPosition: number): Promise<void> {
  // TODO: Restore full implementation
  throw new Error("Function temporarily disabled - will be restored soon");
}