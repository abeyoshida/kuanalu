'use server';

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { subtasks, tasks, users } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { SubtaskWithMeta } from "@/types/subtask";
import { hasPermission } from "@/lib/auth/permissions";

/**
 * Get all subtasks for a task
 */
export async function getTaskSubtasks(taskId: number): Promise<SubtaskWithMeta[]> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to view subtasks");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // First check if the user has access to the task
    const task = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Task not found");
    }
    
    const projectId = task[0].projectId;
    
    // Check if user has permission to view this task's subtasks
    const hasViewPermission = await hasPermission(
      userId,
      projectId,
      'read',
      'subtask'
    );
    
    if (!hasViewPermission) {
      throw new Error("You don't have permission to view subtasks for this task");
    }
    
    // Get all subtasks for the task with assignee names
    const subtasksList = await db
      .select({
        id: subtasks.id,
        title: subtasks.title,
        description: subtasks.description,
        completed: subtasks.completed,
        priority: subtasks.priority,
        taskId: subtasks.taskId,
        assigneeId: subtasks.assigneeId,
        estimatedHours: subtasks.estimatedHours,
        actualHours: subtasks.actualHours,
        dueDate: subtasks.dueDate,
        position: subtasks.position,
        metadata: subtasks.metadata,
        completedAt: subtasks.completedAt,
        createdBy: subtasks.createdBy,
        createdAt: subtasks.createdAt,
        updatedAt: subtasks.updatedAt,
        assigneeName: users.name
      })
      .from(subtasks)
      .leftJoin(users, eq(subtasks.assigneeId, users.id))
      .where(eq(subtasks.taskId, taskId))
      .orderBy(subtasks.position, subtasks.createdAt);
    
    // Get creator names for each subtask
    const subtasksWithMeta = await Promise.all(
      subtasksList.map(async (subtask) => {
        let creatorName;
        
        if (subtask.createdBy) {
          const creator = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, subtask.createdBy))
            .limit(1);
          
          if (creator.length) {
            creatorName = creator[0].name;
          }
        }
        
        return {
          ...subtask,
          assigneeName: subtask.assigneeName || undefined,
          creatorName
        } as SubtaskWithMeta;
      })
    );
    
    return subtasksWithMeta;
  } catch (error) {
    console.error('Failed to get subtasks:', error);
    throw error;
  }
}

/**
 * Get a subtask by ID
 */
export async function getSubtaskById(subtaskId: number): Promise<SubtaskWithMeta | null> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to view subtask details");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the subtask with assignee name
    const subtask = await db
      .select({
        id: subtasks.id,
        title: subtasks.title,
        description: subtasks.description,
        completed: subtasks.completed,
        priority: subtasks.priority,
        taskId: subtasks.taskId,
        assigneeId: subtasks.assigneeId,
        estimatedHours: subtasks.estimatedHours,
        actualHours: subtasks.actualHours,
        dueDate: subtasks.dueDate,
        position: subtasks.position,
        metadata: subtasks.metadata,
        completedAt: subtasks.completedAt,
        createdBy: subtasks.createdBy,
        createdAt: subtasks.createdAt,
        updatedAt: subtasks.updatedAt,
        assigneeName: users.name
      })
      .from(subtasks)
      .leftJoin(users, eq(subtasks.assigneeId, users.id))
      .where(eq(subtasks.id, subtaskId))
      .limit(1)
      .then((results) => results[0] || null);
    
    if (!subtask) {
      throw new Error("Subtask not found");
    }
    
    // Get the task to check permissions
    const task = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, subtask.taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Parent task not found");
    }
    
    const projectId = task[0].projectId;
    
    // Check if user has permission to view this subtask
    const hasViewPermission = await hasPermission(
      userId,
      projectId,
      'read',
      'subtask'
    );
    
    if (!hasViewPermission) {
      throw new Error("You don't have permission to view this subtask");
    }
    
    // Get creator name
    let creatorName;
    if (subtask.createdBy) {
      const creator = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, subtask.createdBy))
        .limit(1);
      
      if (creator.length) {
        creatorName = creator[0].name;
      }
    }
    
    return {
      ...subtask,
      assigneeName: subtask.assigneeName || undefined,
      creatorName
    } as SubtaskWithMeta;
  } catch (error) {
    console.error('Failed to get subtask details:', error);
    throw error;
  }
}

/**
 * Create a new subtask
 */
export async function createSubtask(data: {
  title: string;
  description?: string;
  taskId: number;
  assigneeId?: number;
  priority?: string;
  estimatedHours?: number;
  dueDate?: Date;
  position?: number;
  metadata?: Record<string, unknown>;
}): Promise<SubtaskWithMeta> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to create a subtask");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the task to check permissions
    const task = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, data.taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Task not found");
    }
    
    const projectId = task[0].projectId;
    
    // Check if user has permission to create subtasks
    const hasCreatePermission = await hasPermission(
      userId,
      projectId,
      'create',
      'subtask'
    );
    
    if (!hasCreatePermission) {
      throw new Error("You don't have permission to create subtasks for this task");
    }
    
    // Get max position for ordering
    let position = data.position;
    if (position === undefined) {
      const [maxPositionResult] = await db
        .select({ maxPosition: sql`MAX(${subtasks.position})` })
        .from(subtasks)
        .where(eq(subtasks.taskId, data.taskId));
      
      position = maxPositionResult.maxPosition ? Number(maxPositionResult.maxPosition) + 1 : 0;
    }
    
    // Create the subtask
    const [newSubtask] = await db
      .insert(subtasks)
      .values({
        title: data.title,
        description: data.description || null,
        completed: false,
        priority: data.priority || null,
        taskId: data.taskId,
        assigneeId: data.assigneeId || null,
        estimatedHours: data.estimatedHours || null,
        dueDate: data.dueDate || null,
        position,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    revalidatePath(`/task/${data.taskId}`);
    
    // Get the created subtask with meta information
    const subtaskWithMeta = await getSubtaskById(newSubtask.id);
    
    if (!subtaskWithMeta) {
      throw new Error("Failed to retrieve created subtask");
    }
    
    return subtaskWithMeta;
  } catch (error) {
    console.error('Failed to create subtask:', error);
    throw error;
  }
}

/**
 * Update a subtask
 */
export async function updateSubtask(
  subtaskId: number,
  data: {
    title?: string;
    description?: string | null;
    completed?: boolean;
    priority?: string | null;
    assigneeId?: number | null;
    estimatedHours?: number | null;
    actualHours?: number | null;
    dueDate?: Date | null;
    position?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<SubtaskWithMeta> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to update a subtask");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the subtask to check permissions
    const subtask = await db
      .select({ taskId: subtasks.taskId })
      .from(subtasks)
      .where(eq(subtasks.id, subtaskId))
      .limit(1);
    
    if (!subtask.length) {
      throw new Error("Subtask not found");
    }
    
    const taskId = subtask[0].taskId;
    
    // Get the task to check project permissions
    const task = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Parent task not found");
    }
    
    const projectId = task[0].projectId;
    
    // Check if user has permission to update subtasks
    const hasUpdatePermission = await hasPermission(
      userId,
      projectId,
      'update',
      'subtask'
    );
    
    if (!hasUpdatePermission) {
      throw new Error("You don't have permission to update this subtask");
    }
    
    // Check if completion status is changing
    const isCompletingSubtask = data.completed === true;
    
    // Update the subtask
    await db
      .update(subtasks)
      .set({
        title: data.title !== undefined ? data.title : undefined,
        description: data.description !== undefined ? data.description : undefined,
        completed: data.completed !== undefined ? data.completed : undefined,
        priority: data.priority !== undefined ? data.priority : undefined,
        assigneeId: data.assigneeId !== undefined ? data.assigneeId : undefined,
        estimatedHours: data.estimatedHours !== undefined ? data.estimatedHours : undefined,
        actualHours: data.actualHours !== undefined ? data.actualHours : undefined,
        dueDate: data.dueDate !== undefined ? data.dueDate : undefined,
        position: data.position !== undefined ? data.position : undefined,
        metadata: data.metadata !== undefined ? JSON.stringify(data.metadata) : undefined,
        completedAt: isCompletingSubtask ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(eq(subtasks.id, subtaskId));
    
    revalidatePath(`/task/${taskId}`);
    
    // Get the updated subtask with meta information
    const updatedSubtask = await getSubtaskById(subtaskId);
    
    if (!updatedSubtask) {
      throw new Error("Failed to retrieve updated subtask");
    }
    
    return updatedSubtask;
  } catch (error) {
    console.error('Failed to update subtask:', error);
    throw error;
  }
}

/**
 * Delete a subtask
 */
export async function deleteSubtask(subtaskId: number): Promise<void> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to delete a subtask");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the subtask to check permissions
    const subtask = await db
      .select({ taskId: subtasks.taskId })
      .from(subtasks)
      .where(eq(subtasks.id, subtaskId))
      .limit(1);
    
    if (!subtask.length) {
      throw new Error("Subtask not found");
    }
    
    const taskId = subtask[0].taskId;
    
    // Get the task to check project permissions
    const task = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Parent task not found");
    }
    
    const projectId = task[0].projectId;
    
    // Check if user has permission to delete subtasks
    const hasDeletePermission = await hasPermission(
      userId,
      projectId,
      'delete',
      'subtask'
    );
    
    if (!hasDeletePermission) {
      throw new Error("You don't have permission to delete this subtask");
    }
    
    // Delete the subtask
    await db
      .delete(subtasks)
      .where(eq(subtasks.id, subtaskId));
    
    revalidatePath(`/task/${taskId}`);
  } catch (error) {
    console.error('Failed to delete subtask:', error);
    throw error;
  }
}

/**
 * Update subtask positions (for drag and drop)
 */
export async function updateSubtaskPositions(
  subtaskId: number,
  newPosition: number
): Promise<void> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to update subtask positions");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the subtask to check permissions
    const subtask = await db
      .select({
        taskId: subtasks.taskId,
        position: subtasks.position
      })
      .from(subtasks)
      .where(eq(subtasks.id, subtaskId))
      .limit(1);
    
    if (!subtask.length) {
      throw new Error("Subtask not found");
    }
    
    const taskId = subtask[0].taskId;
    const oldPosition = subtask[0].position || 0;
    
    // Get the task to check project permissions
    const task = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Parent task not found");
    }
    
    const projectId = task[0].projectId;
    
    // Check if user has permission to update subtasks
    const hasUpdatePermission = await hasPermission(
      userId,
      projectId,
      'update',
      'subtask'
    );
    
    if (!hasUpdatePermission) {
      throw new Error("You don't have permission to update subtask positions");
    }
    
    // Start a transaction for position updates
    await db.transaction(async (tx) => {
      if (newPosition > oldPosition) {
        // Moving down, shift subtasks in between up
        await tx
          .update(subtasks)
          .set({
            position: sql`${subtasks.position} - 1`,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(subtasks.taskId, taskId),
              sql`${subtasks.position} > ${oldPosition}`,
              sql`${subtasks.position} <= ${newPosition}`
            )
          );
      } else if (newPosition < oldPosition) {
        // Moving up, shift subtasks in between down
        await tx
          .update(subtasks)
          .set({
            position: sql`${subtasks.position} + 1`,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(subtasks.taskId, taskId),
              sql`${subtasks.position} >= ${newPosition}`,
              sql`${subtasks.position} < ${oldPosition}`
            )
          );
      } else {
        // No position change
        return;
      }
      
      // Update the subtask with new position
      await tx
        .update(subtasks)
        .set({
          position: newPosition,
          updatedAt: new Date()
        })
        .where(eq(subtasks.id, subtaskId));
    });
    
    revalidatePath(`/task/${taskId}`);
  } catch (error) {
    console.error('Failed to update subtask positions:', error);
    throw error;
  }
} 