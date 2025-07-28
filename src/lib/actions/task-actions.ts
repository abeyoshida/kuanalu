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

export async function updateTask(
  taskId: number,
  data: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    type?: TaskType;
    assigneeId?: number | null;
    dueDate?: Date | null;
    startDate?: Date | null;
    estimatedHours?: number | null;
    actualHours?: number | null;
    points?: number | null;
    position?: number | null;
    labels?: string[] | null;
    metadata?: Record<string, unknown> | null;
  }
): Promise<{ success: boolean; message?: string; data?: TaskWithMeta; isPermissionError?: boolean }> {
  console.log('✏️ updateTask called for taskId:', taskId, 'with data keys:', Object.keys(data));
  
  try {
    // Step 1: Auth check
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        message: "You must be logged in to update a task",
        isPermissionError: false
      };
    }
    
    const userId = parseInt(session.user.id);
    console.log('✅ Auth check passed for user:', userId);

    // Step 2: Get the task to check project permissions
    console.log('📋 Fetching task to verify permissions...');
    
    const task = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (!task.length) {
      return {
        success: false,
        message: "Task not found",
        isPermissionError: false
      };
    }
    
    const projectId = task[0].projectId;
    console.log('✅ Task found in project:', projectId);

    // Step 3: Get the organization ID for the project
    const project = await db
      .select({ organizationId: projects.organizationId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    
    if (!project.length) {
      return {
        success: false,
        message: "Project not found",
        isPermissionError: false
      };
    }
    
    const organizationId = project[0].organizationId;

    // Step 4: Permission check - ensure user can update tasks
    console.log('🔒 Checking task update permissions...');
    
    // Check if user is a member of the project first
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
    
    // If not a project member, check organization-level permissions
    if (!isProjectMember) {
      console.log('👀 User not a project member, checking organization permissions...');
      
      const hasUpdatePermission = await hasPermission(
        userId,
        organizationId,
        'update',
        'task'
      );
      
      if (!hasUpdatePermission) {
        return {
          success: false,
          message: "You don't have permission to update tasks in this project",
          isPermissionError: true
        };
      }
      
      console.log('✅ Organization-level update permission granted');
    } else {
      console.log('✅ Project member update access granted');
    }

    // Step 5: Check if status is changing to 'done' for completion timestamp
    const isCompletingTask = data.status === 'done';
    console.log('📊 Task completion status:', isCompletingTask);

    // Step 6: Update the task
    console.log('💾 Updating task in database...');
    
    await db
      .update(tasks)
      .set({
        title: data.title !== undefined ? data.title : undefined,
        description: data.description !== undefined ? data.description : undefined,
        status: data.status !== undefined ? data.status : undefined,
        priority: data.priority !== undefined ? data.priority : undefined,
        type: data.type !== undefined ? data.type : undefined,
        assigneeId: data.assigneeId !== undefined ? data.assigneeId : undefined,
        dueDate: data.dueDate !== undefined ? data.dueDate : undefined,
        startDate: data.startDate !== undefined ? data.startDate : undefined,
        estimatedHours: data.estimatedHours !== undefined ? data.estimatedHours : undefined,
        actualHours: data.actualHours !== undefined ? data.actualHours : undefined,
        points: data.points !== undefined ? data.points : undefined,
        position: data.position !== undefined ? data.position : undefined,
        labels: data.labels !== undefined ? JSON.stringify(data.labels) : undefined,
        metadata: data.metadata !== undefined ? JSON.stringify(data.metadata) : undefined,
        completedAt: isCompletingTask ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId));

    console.log('✅ Task updated in database');

    // Step 7: Revalidate cache
    revalidatePath(`/task/${taskId}`);
    revalidatePath(`/projects/${projectId}`);

    // Step 8: Get the updated task with meta information
    console.log('📋 Retrieving updated task with metadata...');
    
    const updatedTask = await getTaskById(taskId);
    
    if (!updatedTask) {
      return {
        success: false,
        message: "Failed to retrieve updated task",
        isPermissionError: false
      };
    }

    console.log('✅ Task update complete:', updatedTask.title);
    
    return {
      success: true,
      data: updatedTask
    };
  } catch (error) {
    console.error('❌ Failed to update task:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      isPermissionError: false
    };
  }
}

export async function deleteTask(taskId: number): Promise<void> {
  console.log('🗑️ deleteTask called for taskId:', taskId);
  
  try {
    // Step 1: Auth check
    const session = await auth();
    if (!session?.user) {
      throw new Error("You must be logged in to delete a task");
    }
    
    const userId = parseInt(session.user.id);
    console.log('✅ Auth check passed for user:', userId);

    // Step 2: Get the task and project to check permissions and organization ID
    console.log('📋 Fetching task and project info...');
    
    const taskWithProject = await db
      .select({
        projectId: tasks.projectId,
        organizationId: projects.organizationId,
        taskTitle: tasks.title
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (!taskWithProject.length) {
      throw new Error("Task not found");
    }
    
    const { projectId, organizationId, taskTitle } = taskWithProject[0];
    console.log('✅ Task found:', taskTitle, 'in project:', projectId, 'organization:', organizationId);

    // Step 3: Permission check - ensure user can delete tasks
    console.log('🔒 Checking task deletion permissions...');
    
    // Check if user is a member of the project first
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
    
    // If not a project member, check organization-level permissions
    if (!isProjectMember) {
      console.log('👀 User not a project member, checking organization permissions...');
      
      const hasDeletePermission = await hasPermission(
        userId,
        organizationId,
        'delete',
        'task'
      );
      
      if (!hasDeletePermission) {
        throw new Error("You don't have permission to delete tasks in this project");
      }
      
      console.log('✅ Organization-level delete permission granted');
    } else {
      console.log('✅ Project member delete access granted');
    }

    // Step 4: Soft delete by setting archivedAt timestamp
    console.log('💾 Soft deleting task (setting archivedAt)...');
    
    await db
      .update(tasks)
      .set({
        archivedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId));

    console.log('✅ Task soft deleted (archived)');

    // Step 5: Revalidate cache so task disappears from UI
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/task/${taskId}`); // In case someone has task detail page open
    
    console.log('✅ Task deletion complete for:', taskTitle);
  } catch (error) {
    console.error('❌ Failed to delete task:', error);
    throw error;
  }
}

export async function updateTaskPositions(taskId: number, newStatus: string, newPosition: number): Promise<void> {
  // TODO: Restore full implementation
  throw new Error("Function temporarily disabled - will be restored soon");
}