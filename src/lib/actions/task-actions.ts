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
  console.log('🔍 getTaskById called with taskId:', taskId);
  
  try {
    // Step 1: Auth check
    const session = await auth();
    if (!session?.user) {
      throw new Error("You must be logged in to view task details");
    }
    
    const userId = parseInt(session.user.id);
    console.log('✅ Auth check passed for user:', userId);

    // Step 2: Get the task with basic details
    console.log('📋 Fetching task from database...');
    
    const task = await db
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
        archivedAt: tasks.archivedAt
      })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1)
      .then(results => results[0] || null);
    
    if (!task) {
      console.log('❌ Task not found in database');
      return null;
    }
    
    console.log('✅ Task found:', task.title);

    // Step 3: Permission check - ensure user has access to this task's project
    console.log('🔒 Checking task access permissions...');
    
    // Check if user is a member of the project
    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, task.projectId)
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
        .where(eq(projects.id, task.projectId))
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
        throw new Error("You don't have access to this task");
      }
      
      console.log('✅ Organization-level permission granted');
    } else {
      console.log('✅ Project member access granted');
    }

    // Step 4: Get additional data (assignee, reporter, metadata)
    console.log('📊 Adding metadata...');
    
    // Get assignee name
    const assignee = task.assigneeId ? await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, task.assigneeId))
      .limit(1)
      .then(results => results[0] || null) : null;
    
    // Get reporter name
    const reporter = task.reporterId ? await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, task.reporterId))
      .limit(1)
      .then(results => results[0] || null) : null;
    
    // Get subtask count
    const [subtaskResult] = await db
      .select({ count: count() })
      .from(subtasks)
      .where(eq(subtasks.taskId, taskId));
    
    // Get comment count
    const [commentResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.taskId, taskId));
    
    // Get child task count
    const [childTaskResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.parentTaskId, taskId),
          isNull(tasks.archivedAt)
        )
      );
    
    // Check if task is overdue
    const isOverdue = task.dueDate && task.status !== 'done' && 
      new Date(task.dueDate) < new Date() && !task.completedAt;
    
    const taskWithMeta: TaskWithMeta = {
      ...task,
      assigneeName: assignee?.name,
      reporterName: reporter?.name,
      subtaskCount: Number(subtaskResult.count),
      commentCount: Number(commentResult.count),
      childTaskCount: Number(childTaskResult.count),
      isOverdue: isOverdue || false
    };

    console.log('✅ Task details retrieved with full metadata');
    
    return taskWithMeta;
  } catch (error) {
    console.error('❌ Failed to get task details:', error);
    throw error;
  }
}

export async function createTask(input: CreateTaskInput): Promise<TaskWithMeta> {
  console.log('🆕 createTask called with input:', { title: input.title, projectId: input.projectId });
  
  try {
    // Step 1: Auth check
    const session = await auth();
    if (!session?.user) {
      throw new Error("You must be logged in to create a task");
    }
    
    const userId = parseInt(session.user.id);
    console.log('✅ Auth check passed for user:', userId);

    // Step 2: Permission check - ensure user can create tasks in this project
    console.log('🔒 Checking task creation permissions...');
    
    // Check if user is a member of the project
    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, input.projectId)
        )
      )
      .limit(1);
    
    const isProjectMember = membership.length > 0;
    
    // If not a project member, check if user has organization-level permissions
    if (!isProjectMember) {
      console.log('👀 User not a project member, checking organization permissions...');
      
      // Get the project and its organization
      const project = await db
        .select({
          organizationId: projects.organizationId
        })
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);
      
      if (!project.length) {
        throw new Error("Project not found");
      }
      
      // Check if user has organization-level permissions
      const hasCreatePermission = await hasPermission(
        userId,
        project[0].organizationId,
        'create',
        'task'
      );
      
      if (!hasCreatePermission) {
        throw new Error("You don't have permission to create tasks in this project");
      }
      
      console.log('✅ Organization-level create permission granted');
    } else {
      console.log('✅ Project member create access granted');
    }

    // Step 3: Get the highest position for the status column
    console.log('📊 Calculating task position...');
    
    const [positionResult] = await db
      .select({
        maxPosition: sql<number>`COALESCE(MAX(${tasks.position}), -1) + 1`
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.projectId, input.projectId),
          eq(tasks.status, input.status || 'todo')
        )
      );

    const newPosition = positionResult.maxPosition;
    console.log('✅ New task position:', newPosition);

    // Step 4: Create the task
    console.log('💾 Creating new task in database...');
    
    const [newTask] = await db
      .insert(tasks)
      .values({
        title: input.title,
        description: input.description || null,
        status: input.status || 'todo',
        priority: input.priority || 'medium',
        type: input.type || 'task',
        projectId: input.projectId,
        assigneeId: input.assigneeId || null,
        reporterId: userId,
        parentTaskId: input.parentTaskId || null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        estimatedHours: input.estimatedHours || null,
        points: input.points || null,
        position: newPosition,
        labels: input.labels ? JSON.stringify(input.labels) : null,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    console.log('✅ Task created with ID:', newTask.id);

    // Step 5: Get the task with full metadata
    console.log('📋 Retrieving created task with metadata...');
    
    const taskWithMeta = await getTaskById(newTask.id);
    
    if (!taskWithMeta) {
      throw new Error("Failed to retrieve created task");
    }

    // Step 6: Revalidate the project page cache
    revalidatePath(`/projects/${input.projectId}`);
    
    console.log('✅ Task creation complete:', taskWithMeta.title);
    
    return taskWithMeta;
  } catch (error) {
    console.error('❌ Failed to create task:', error);
    throw error;
  }
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