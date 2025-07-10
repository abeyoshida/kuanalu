'use server';

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
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to view tasks");
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
    
    const isProjectMember = membership.length > 0;
    
    // If not a project member, check if project is public or if user has organization-level permissions
    if (!isProjectMember) {
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
    }
    
    // Build where conditions based on filters
    const whereConditions = [eq(tasks.projectId, projectId)];
    
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        whereConditions.push(inArray(tasks.status, filters.status));
      }
      
      if (filters.priority && filters.priority.length > 0) {
        whereConditions.push(inArray(tasks.priority, filters.priority));
      }
      
      if (filters.type && filters.type.length > 0) {
        whereConditions.push(inArray(tasks.type, filters.type));
      }
      
      if (filters.assigneeId && filters.assigneeId.length > 0) {
        whereConditions.push(inArray(tasks.assigneeId, filters.assigneeId));
      }
      
      if (filters.reporterId && filters.reporterId.length > 0) {
        whereConditions.push(inArray(tasks.reporterId, filters.reporterId));
      }
      
      if (filters.dueDate) {
        if (filters.dueDate.from) {
          whereConditions.push(sql`${tasks.dueDate} >= ${filters.dueDate.from}`);
        }
        if (filters.dueDate.to) {
          whereConditions.push(sql`${tasks.dueDate} <= ${filters.dueDate.to}`);
        }
      }
      
      if (filters.search) {
        whereConditions.push(
          sql`(${tasks.title} LIKE ${`%${filters.search}%`} OR (${tasks.description} IS NOT NULL AND ${tasks.description} LIKE ${`%${filters.search}%`}))`
        );
      }
      
      if (!filters.includeArchived) {
        whereConditions.push(isNull(tasks.archivedAt));
      }
      
      if (!filters.includeCompleted) {
        whereConditions.push(sql`${tasks.status} != 'done'`);
      }
    } else {
      // Default: exclude archived tasks
      whereConditions.push(isNull(tasks.archivedAt));
    }
    
    // Build query
    const baseQuery = db
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
      .where(and(...whereConditions));
    
    // Execute query with sorting
    const tasksList = await baseQuery.orderBy(asc(tasks.position));
    
    // Get subtask, comment, and child task counts
    const tasksWithMeta = await Promise.all(
      tasksList.map(async (task: Record<string, unknown>) => {
        const [subtaskResult] = await db
          .select({ count: count() })
          .from(subtasks)
          .where(eq(subtasks.taskId, task.id as number));
        
        const [commentResult] = await db
          .select({ count: count() })
          .from(comments)
          .where(eq(comments.taskId, task.id as number));
        
        const [childTaskResult] = await db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.parentTaskId, task.id as number),
              isNull(tasks.archivedAt)
            )
          );
        
        // Check if task is overdue
        const isOverdue = task.dueDate && task.status !== 'done' && 
          new Date(task.dueDate as Date) < new Date() && !task.completedAt;
        
        return {
          ...task,
          reporterName: undefined,
          assigneeName: task.assigneeName || undefined,
          subtaskCount: Number(subtaskResult.count),
          commentCount: Number(commentResult.count),
          childTaskCount: Number(childTaskResult.count),
          isOverdue: isOverdue || false
        } as TaskWithMeta;
      })
    );
    
    return tasksWithMeta;
  } catch (error) {
    console.error('Failed to get project tasks:', error);
    throw error;
  }
}

/**
 * Get a task by ID
 */
export async function getTaskById(taskId: number): Promise<TaskWithMeta | null> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to view task details");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the task with basic details
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
      return null;
    }
    
    // Check if user is a member of the project
    const projectMembership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, task.projectId)
        )
      )
      .limit(1);
    
    const isProjectMember = projectMembership.length > 0;
    
    // If not a project member, check if project is public or if user has organization-level permissions
    if (!isProjectMember) {
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
    }
    
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
    
    return {
      ...task,
      assigneeName: assignee?.name,
      reporterName: reporter?.name,
      subtaskCount: Number(subtaskResult.count),
      commentCount: Number(commentResult.count),
      childTaskCount: Number(childTaskResult.count),
      isOverdue: isOverdue || false
    };
  } catch (error) {
    console.error('Failed to get task details:', error);
    return null;
  }
}

/**
 * Create a new task
 */
export async function createTask(input: CreateTaskInput): Promise<TaskWithMeta> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to create a task");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Check if user is a member of the project
    const projectMembership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, input.projectId)
        )
      )
      .limit(1);
    
    const isProjectMember = projectMembership.length > 0;
    
    // If not a project member, check if user has organization-level permissions
    if (!isProjectMember) {
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
    }
    
    // Get the highest position for the status
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
    
    // Create the task
    const [newTask] = await db
      .insert(tasks)
      .values({
        title: input.title,
        description: input.description,
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
        position: positionResult.maxPosition,
        labels: input.labels || [],
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Get the task with meta information
    const taskWithMeta = await getTaskById(newTask.id);
    
    if (!taskWithMeta) {
      throw new Error("Failed to retrieve created task");
    }
    
    revalidatePath(`/projects/${input.projectId}`);
    
    return taskWithMeta;
  } catch (error) {
    console.error('Failed to create task:', error);
    throw error;
  }
}

/**
 * Update a task
 */
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
  const session = await auth();
  
  if (!session?.user) {
    return {
      success: false,
      message: "You must be logged in to update a task",
      isPermissionError: false
    };
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the task to check project permissions
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
    
    // Get the organization ID for the project
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
    
    // Check if user has permission to update tasks
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
    
    // Check if status is changing to 'done'
    const isCompletingTask = data.status === 'done';
    
    // Update the task
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
    
    revalidatePath(`/task/${taskId}`);
    revalidatePath(`/projects/${projectId}`);
    
    // Get the updated task with meta information
    const updatedTask = await getTaskById(taskId);
    
    if (!updatedTask) {
      return {
        success: false,
        message: "Failed to retrieve updated task",
        isPermissionError: false
      };
    }
    
    return {
      success: true,
      data: updatedTask
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: number): Promise<void> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to delete a task");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the task to check permissions and project ID
    const task = await db
      .select({
        projectId: tasks.projectId
      })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Task not found");
    }
    
    const projectId = task[0].projectId;
    
    // Check if user has permission to delete tasks in this project
    const hasDeletePermission = await hasPermission(
      userId,
      projectId,
      'delete',
      'task'
    );
    
    if (!hasDeletePermission) {
      throw new Error("You don't have permission to delete tasks in this project");
    }
    
    // Soft delete by setting archivedAt
    await db
      .update(tasks)
      .set({
        archivedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId));
    
    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    console.error('Failed to delete task:', error);
    throw error;
  }
}

/**
 * Update task positions (for drag and drop)
 */
export async function updateTaskPositions(
  taskId: number, 
  newStatus: string, 
  newPosition: number
): Promise<void> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to update task positions");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the task to check permissions and project ID
    const task = await db
      .select({
        projectId: tasks.projectId,
        status: tasks.status,
        position: tasks.position
      })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Task not found");
    }
    
    const projectId = task[0].projectId;
    const oldStatus = task[0].status;
    const oldPosition = task[0].position || 0;
    
    // Get the organization ID from the project
    const project = await db
      .select({
        organizationId: projects.organizationId
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    
    if (!project.length) {
      throw new Error("Project not found");
    }
    
    const organizationId = project[0].organizationId;
    
    // First check if user is a member of the project
    const projectMembership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, projectId)
        )
      )
      .limit(1);
    
    const isProjectMember = projectMembership.length > 0;
    
    // If not a project member, check organization permissions
    if (!isProjectMember) {
      // Check if user has permission to update tasks in this project's organization
      const hasUpdatePermission = await hasPermission(
        userId,
        organizationId,
        'update',
        'task'
      );
      
      if (!hasUpdatePermission) {
        throw new Error("You don't have permission to update tasks in this project");
      }
    }
    
    // Validate newStatus is a valid task status
    if (!["todo", "today", "in_progress", "in_review", "done"].includes(newStatus)) {
      throw new Error("Invalid task status");
    }
    
    const typedNewStatus = newStatus as "todo" | "today" | "in_progress" | "in_review" | "done";
    
    // No change in position or status
    if (oldStatus === typedNewStatus && oldPosition === newPosition) {
      return;
    }
    
    // Use updateMultipleEntities instead of sequential updates
    const operations = [];
    
    // If status changed, we need to update positions in both columns
    if (oldStatus !== typedNewStatus) {
      // 1. Update positions in the old status column (shift up)
      operations.push(async () => {
        return await db
          .update(tasks)
          .set({
            position: sql`${tasks.position} - 1`,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(tasks.projectId, projectId),
              eq(tasks.status, oldStatus),
              sql`${tasks.position} > ${oldPosition}`
            )
          );
      });
      
      // 2. Make space in the new status column (shift down)
      operations.push(async () => {
        return await db
          .update(tasks)
          .set({
            position: sql`${tasks.position} + 1`,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(tasks.projectId, projectId),
              eq(tasks.status, typedNewStatus),
              sql`${tasks.position} >= ${newPosition}`
            )
          );
      });
      
      // 3. Update the task with new status and position
      operations.push(async () => {
        return await db
          .update(tasks)
          .set({
            status: typedNewStatus,
            position: newPosition,
            updatedAt: new Date(),
            completedAt: typedNewStatus === 'done' ? new Date() : (oldStatus === 'done' ? null : undefined)
          })
          .where(eq(tasks.id, taskId));
      });
    } else {
      // Same status, just reordering
      if (newPosition > oldPosition) {
        // Moving down, shift tasks in between up
        operations.push(async () => {
          return await db
            .update(tasks)
            .set({
              position: sql`${tasks.position} - 1`,
              updatedAt: new Date()
            })
            .where(
              and(
                eq(tasks.projectId, projectId),
                eq(tasks.status, typedNewStatus),
                sql`${tasks.position} > ${oldPosition}`,
                sql`${tasks.position} <= ${newPosition}`
              )
            );
        });
      } else if (newPosition < oldPosition) {
        // Moving up, shift tasks in between down
        operations.push(async () => {
          return await db
            .update(tasks)
            .set({
              position: sql`${tasks.position} + 1`,
              updatedAt: new Date()
            })
            .where(
              and(
                eq(tasks.projectId, projectId),
                eq(tasks.status, typedNewStatus),
                sql`${tasks.position} >= ${newPosition}`,
                sql`${tasks.position} < ${oldPosition}`
              )
            );
        });
      }
      
      // Update the task with new position
      operations.push(async () => {
        return await db
          .update(tasks)
          .set({
            position: newPosition,
            updatedAt: new Date()
          })
          .where(eq(tasks.id, taskId));
      });
    }
    
    // Execute all operations
    await updateMultipleEntities(operations);
    
    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    console.error('Failed to update task positions:', error);
    throw error;
  }
} 