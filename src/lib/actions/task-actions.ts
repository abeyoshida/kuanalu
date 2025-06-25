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
  UpdateTaskInput,
  TaskFilterOptions
} from "@/types/task";
import { hasPermission } from "@/lib/auth/permissions";

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
    
    const isProjectMember = membership.length > 0;
    
    if (!isProjectMember) {
      // Check if project is public
      const project = await db
        .select({ visibility: projects.visibility })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
      
      if (!project.length || project[0].visibility !== 'public') {
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
    // Get the task with meta information
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
        archivedAt: tasks.archivedAt,
        assigneeName: users.name
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(eq(tasks.id, taskId))
      .limit(1)
      .then((results) => results[0] || null);
    
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Create a result object with reporterName property
    const taskResult = {
      ...task,
      reporterName: undefined as string | undefined,
      assigneeName: task.assigneeName || undefined,
      subtaskCount: 0,
      commentCount: 0,
      childTaskCount: 0,
      isOverdue: false
    } as TaskWithMeta;
    
    // Check if user has access to the project
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
    
    if (!isProjectMember) {
      // Check if project is public
      const project = await db
        .select({ visibility: projects.visibility })
        .from(projects)
        .where(eq(projects.id, task.projectId))
        .limit(1);
      
      if (!project.length || project[0].visibility !== 'public') {
        throw new Error("You don't have access to this task");
      }
    }
    
    // Get reporter name
    if (task.reporterId) {
      const reporter = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, task.reporterId))
        .limit(1);
      
      if (reporter.length) {
        taskResult.reporterName = reporter[0].name;
      }
    }
    
    // Get subtask, comment, and child task counts
    const [subtaskResult] = await db
      .select({ count: count() })
      .from(subtasks)
      .where(eq(subtasks.taskId, taskId));
    
    const [commentResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.taskId, taskId));
    
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
      ...taskResult,
      subtaskCount: Number(subtaskResult.count),
      commentCount: Number(commentResult.count),
      childTaskCount: Number(childTaskResult.count),
      isOverdue: isOverdue || false
    };
  } catch (error) {
    console.error('Failed to get task details:', error);
    throw error;
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
    // Check if user has permission to create tasks in this project
    const hasCreatePermission = await hasPermission(
      userId,
      input.projectId,
      'create',
      'task'
    );
    
    if (!hasCreatePermission) {
      throw new Error("You don't have permission to create tasks in this project");
    }
    
    // Get max position for the status column
    const [maxPositionResult] = await db
      .select({ maxPosition: sql`MAX(${tasks.position})` })
      .from(tasks)
      .where(
        and(
          eq(tasks.projectId, input.projectId),
          eq(tasks.status, input.status || 'todo')
        )
      );
    
    const position = maxPositionResult.maxPosition ? Number(maxPositionResult.maxPosition) + 1 : 0;
    
    // Create the task
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
        reporterId: input.reporterId || userId,
        parentTaskId: input.parentTaskId || null,
        dueDate: input.dueDate || null,
        startDate: input.startDate || null,
        estimatedHours: input.estimatedHours || null,
        points: input.points || null,
        position: input.position !== undefined ? input.position : position,
        labels: input.labels ? JSON.stringify(input.labels) : null,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    revalidatePath(`/projects/${input.projectId}`);
    
    // Get the task with meta information
    const taskWithMeta = await getTaskById(newTask.id);
    
    if (!taskWithMeta) {
      throw new Error("Failed to retrieve created task");
    }
    
    return taskWithMeta;
  } catch (error) {
    console.error('Failed to create task:', error);
    throw error;
  }
}

/**
 * Update a task
 */
export async function updateTask(taskId: number, input: UpdateTaskInput): Promise<TaskWithMeta> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to update a task");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the task to check permissions and project ID
    const task = await db
      .select({
        projectId: tasks.projectId,
        status: tasks.status
      })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Task not found");
    }
    
    const projectId = task[0].projectId;
    
    // Check if user has permission to update tasks in this project
    const hasUpdatePermission = await hasPermission(
      userId,
      projectId,
      'update',
      'task'
    );
    
    if (!hasUpdatePermission) {
      throw new Error("You don't have permission to update tasks in this project");
    }
    
    // If status is changing, update position
    let position = input.position;
    if (input.status && input.status !== task[0].status && position === undefined) {
      // Get max position for the new status column
      const [maxPositionResult] = await db
        .select({ maxPosition: sql`MAX(${tasks.position})` })
        .from(tasks)
        .where(
          and(
            eq(tasks.projectId, projectId),
            eq(tasks.status, input.status)
          )
        );
      
      position = maxPositionResult.maxPosition ? Number(maxPositionResult.maxPosition) + 1 : 0;
    }
    
    // Check if status is changing to 'done'
    const isCompletingTask = input.status === 'done' && task[0].status !== 'done';
    
    // Check if status is changing from 'done' to something else
    const isReopeningTask = input.status && input.status !== 'done' && task[0].status === 'done';
    
    // Update the task
    await db
      .update(tasks)
      .set({
        title: input.title !== undefined ? input.title : undefined,
        description: input.description !== undefined ? input.description : undefined,
        status: input.status !== undefined ? input.status : undefined,
        priority: input.priority !== undefined ? input.priority : undefined,
        type: input.type !== undefined ? input.type : undefined,
        assigneeId: input.assigneeId !== undefined ? input.assigneeId : undefined,
        reporterId: input.reporterId !== undefined ? input.reporterId : undefined,
        parentTaskId: input.parentTaskId !== undefined ? input.parentTaskId : undefined,
        dueDate: input.dueDate !== undefined ? input.dueDate : undefined,
        startDate: input.startDate !== undefined ? input.startDate : undefined,
        estimatedHours: input.estimatedHours !== undefined ? input.estimatedHours : undefined,
        actualHours: input.actualHours !== undefined ? input.actualHours : undefined,
        points: input.points !== undefined ? input.points : undefined,
        position: position !== undefined ? position : undefined,
        labels: input.labels !== undefined ? JSON.stringify(input.labels) : undefined,
        metadata: input.metadata !== undefined ? JSON.stringify(input.metadata) : undefined,
        completedAt: isCompletingTask ? new Date() : (isReopeningTask ? null : undefined),
        archivedAt: input.archived ? new Date() : (input.archived === false ? null : undefined),
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId));
    
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/task/${taskId}`);
    
    // Get the updated task with meta information
    const updatedTask = await getTaskById(taskId);
    
    if (!updatedTask) {
      throw new Error("Failed to retrieve updated task");
    }
    
    return updatedTask;
  } catch (error) {
    console.error('Failed to update task:', error);
    throw error;
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
    
    // Validate newStatus is a valid task status
    if (!["backlog", "todo", "in_progress", "in_review", "done"].includes(newStatus)) {
      throw new Error("Invalid task status");
    }
    
    const typedNewStatus = newStatus as "backlog" | "todo" | "in_progress" | "in_review" | "done";
    
    // Instead of using a transaction, perform updates sequentially
    // If status changed, we need to update positions in both columns
    if (oldStatus !== typedNewStatus) {
      // 1. Update positions in the old status column (shift up)
      await db
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
      
      // 2. Make space in the new status column (shift down)
      await db
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
      
      // 3. Update the task with new status and position
      await db
        .update(tasks)
        .set({
          status: typedNewStatus,
          position: newPosition,
          updatedAt: new Date(),
          completedAt: typedNewStatus === 'done' ? new Date() : (oldStatus === 'done' ? null : undefined)
        })
        .where(eq(tasks.id, taskId));
    } else {
      // Same status, just reordering
      if (newPosition > oldPosition) {
        // Moving down, shift tasks in between up
        await db
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
      } else if (newPosition < oldPosition) {
        // Moving up, shift tasks in between down
        await db
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
      } else {
        // No position change
        return;
      }
      
      // Update the task with new position
      await db
        .update(tasks)
        .set({
          position: newPosition,
          updatedAt: new Date()
        })
        .where(eq(tasks.id, taskId));
    }
    
    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    console.error('Failed to update task positions:', error);
    throw error;
  }
} 