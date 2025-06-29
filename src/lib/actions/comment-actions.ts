'use server';

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { comments, tasks, users, projects } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { CommentWithMeta } from "@/types/comment";
import { hasPermission } from "@/lib/auth/permissions";

/**
 * Get all comments for a task
 */
export async function getTaskComments(taskId: number): Promise<CommentWithMeta[]> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to view comments");
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
    
    // Get the organization ID for the project
    const project = await db
      .select({ organizationId: projects.organizationId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    
    if (!project.length) {
      throw new Error("Project not found");
    }
    
    const organizationId = project[0].organizationId;
    
    // Check if user has permission to view this task's comments
    const hasViewPermission = await hasPermission(
      userId,
      organizationId,
      'read',
      'comment'
    );
    
    if (!hasViewPermission) {
      throw new Error("You don't have permission to view comments for this task");
    }
    
    // Get all comments for the task with user information
    const commentsList = await db
      .select({
        id: comments.id,
        content: comments.content,
        type: comments.type,
        taskId: comments.taskId,
        userId: comments.userId,
        parentId: comments.parentId,
        edited: comments.edited,
        editedAt: comments.editedAt,
        editedBy: comments.editedBy,
        isResolved: comments.isResolved,
        resolvedAt: comments.resolvedAt,
        resolvedBy: comments.resolvedBy,
        metadata: comments.metadata,
        mentions: comments.mentions,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userName: users.name,
        userImage: users.image
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.taskId, taskId))
      .orderBy(desc(comments.createdAt));
    
    // Get additional user information for edited/resolved comments
    const commentsWithMeta = await Promise.all(
      commentsList.map(async (comment) => {
        let editorName;
        let resolverName;
        
        if (comment.editedBy) {
          const editor = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, comment.editedBy))
            .limit(1);
          
          if (editor.length) {
            editorName = editor[0].name;
          }
        }
        
        if (comment.resolvedBy) {
          const resolver = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, comment.resolvedBy))
            .limit(1);
          
          if (resolver.length) {
            resolverName = resolver[0].name;
          }
        }
        
        return {
          ...comment,
          editorName,
          resolverName
        } as CommentWithMeta;
      })
    );
    
    return commentsWithMeta;
  } catch (error) {
    console.error('Failed to get comments:', error);
    throw error;
  }
}

/**
 * Get a comment by ID
 */
export async function getCommentById(commentId: number): Promise<CommentWithMeta | null> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to view comment details");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the comment with user information
    const comment = await db
      .select({
        id: comments.id,
        content: comments.content,
        type: comments.type,
        taskId: comments.taskId,
        userId: comments.userId,
        parentId: comments.parentId,
        edited: comments.edited,
        editedAt: comments.editedAt,
        editedBy: comments.editedBy,
        isResolved: comments.isResolved,
        resolvedAt: comments.resolvedAt,
        resolvedBy: comments.resolvedBy,
        metadata: comments.metadata,
        mentions: comments.mentions,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userName: users.name,
        userImage: users.image
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.id, commentId))
      .limit(1)
      .then((results) => results[0] || null);
    
    if (!comment) {
      throw new Error("Comment not found");
    }
    
    // Get the task to check permissions
    const task = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, comment.taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Task not found");
    }
    
    const projectId = task[0].projectId;
    
    // Check if user has permission to view this comment
    const hasViewPermission = await hasPermission(
      userId,
      projectId,
      'read',
      'comment'
    );
    
    if (!hasViewPermission) {
      throw new Error("You don't have permission to view this comment");
    }
    
    // Get additional user information for edited/resolved comments
    let editorName;
    let resolverName;
    
    if (comment.editedBy) {
      const editor = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, comment.editedBy))
        .limit(1);
      
      if (editor.length) {
        editorName = editor[0].name;
      }
    }
    
    if (comment.resolvedBy) {
      const resolver = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, comment.resolvedBy))
        .limit(1);
      
      if (resolver.length) {
        resolverName = resolver[0].name;
      }
    }
    
    return {
      ...comment,
      editorName,
      resolverName
    } as CommentWithMeta;
  } catch (error) {
    console.error('Failed to get comment details:', error);
    throw error;
  }
}

/**
 * Create a new comment
 */
export async function createComment(data: {
  content: string;
  type?: string;
  taskId: number;
  parentId?: number;
  metadata?: Record<string, unknown>;
  mentions?: string[];
}): Promise<CommentWithMeta> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to create a comment");
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
    
    // Check if user has permission to comment on this task
    const hasCreatePermission = await hasPermission(
      userId,
      projectId,
      'create',
      'comment'
    );
    
    if (!hasCreatePermission) {
      throw new Error("You don't have permission to comment on this task");
    }
    
    // If this is a reply, check if parent comment exists
    if (data.parentId) {
      const parentComment = await db
        .select({ id: comments.id })
        .from(comments)
        .where(eq(comments.id, data.parentId))
        .limit(1);
      
      if (!parentComment.length) {
        throw new Error("Parent comment not found");
      }
    }
    
    // Create the comment
    const [newComment] = await db
      .insert(comments)
      .values({
        content: data.content,
        type: (data.type || 'text') as 'text' | 'code' | 'attachment' | 'system' | 'mention',
        taskId: data.taskId,
        userId: userId,
        parentId: data.parentId || null,
        edited: false,
        isResolved: false,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        mentions: data.mentions ? JSON.stringify(data.mentions) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    revalidatePath(`/task/${data.taskId}`);
    
    // Get the created comment with meta information
    const commentWithMeta = await getCommentById(newComment.id);
    
    if (!commentWithMeta) {
      throw new Error("Failed to retrieve created comment");
    }
    
    return commentWithMeta;
  } catch (error) {
    console.error('Failed to create comment:', error);
    throw error;
  }
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: number,
  data: {
    content?: string;
    isResolved?: boolean;
    metadata?: Record<string, unknown>;
    mentions?: string[];
  }
): Promise<CommentWithMeta> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to update a comment");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the comment to check permissions
    const comment = await db
      .select({
        taskId: comments.taskId,
        userId: comments.userId,
        isResolved: comments.isResolved
      })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);
    
    if (!comment.length) {
      throw new Error("Comment not found");
    }
    
    const taskId = comment[0].taskId;
    const commentUserId = comment[0].userId;
    
    // Get the task to check project permissions
    const task = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Task not found");
    }
    
    const projectId = task[0].projectId;
    
    // Check if user is the comment author or has admin permissions
    const isAuthor = commentUserId === userId;
    const hasUpdatePermission = await hasPermission(
      userId,
      projectId,
      'update',
      'comment'
    );
    
    if (!isAuthor && !hasUpdatePermission) {
      throw new Error("You don't have permission to update this comment");
    }
    
    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    };
    
    // If content is being updated
    if (data.content !== undefined) {
      // Only the author can edit the content
      if (!isAuthor) {
        throw new Error("Only the comment author can edit the content");
      }
      
      updateData.content = data.content;
      updateData.edited = true;
      updateData.editedAt = new Date();
      updateData.editedBy = userId;
    }
    
    // If resolution status is being updated
    if (data.isResolved !== undefined && data.isResolved !== comment[0].isResolved) {
      updateData.isResolved = data.isResolved;
      
      if (data.isResolved) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = userId;
      } else {
        updateData.resolvedAt = null;
        updateData.resolvedBy = null;
      }
    }
    
    // Update metadata and mentions if provided
    if (data.metadata !== undefined) {
      updateData.metadata = JSON.stringify(data.metadata);
    }
    
    if (data.mentions !== undefined) {
      updateData.mentions = JSON.stringify(data.mentions);
    }
    
    // Update the comment
    await db
      .update(comments)
      .set(updateData)
      .where(eq(comments.id, commentId));
    
    revalidatePath(`/task/${taskId}`);
    
    // Get the updated comment with meta information
    const updatedComment = await getCommentById(commentId);
    
    if (!updatedComment) {
      throw new Error("Failed to retrieve updated comment");
    }
    
    return updatedComment;
  } catch (error) {
    console.error('Failed to update comment:', error);
    throw error;
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: number): Promise<void> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to delete a comment");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the comment to check permissions
    const comment = await db
      .select({
        taskId: comments.taskId,
        userId: comments.userId
      })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);
    
    if (!comment.length) {
      throw new Error("Comment not found");
    }
    
    const taskId = comment[0].taskId;
    const commentUserId = comment[0].userId;
    
    // Get the task to check project permissions
    const task = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Task not found");
    }
    
    const projectId = task[0].projectId;
    
    // Check if user is the comment author or has admin permissions
    const isAuthor = commentUserId === userId;
    const hasDeletePermission = await hasPermission(
      userId,
      projectId,
      'delete',
      'comment'
    );
    
    if (!isAuthor && !hasDeletePermission) {
      throw new Error("You don't have permission to delete this comment");
    }
    
    // Delete the comment
    await db
      .delete(comments)
      .where(eq(comments.id, commentId));
    
    revalidatePath(`/task/${taskId}`);
  } catch (error) {
    console.error('Failed to delete comment:', error);
    throw error;
  }
}

/**
 * Get replies for a comment
 */
export async function getCommentReplies(commentId: number): Promise<CommentWithMeta[]> {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to view comment replies");
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // Get the parent comment to check permissions
    const parentComment = await db
      .select({ taskId: comments.taskId })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);
    
    if (!parentComment.length) {
      throw new Error("Parent comment not found");
    }
    
    const taskId = parentComment[0].taskId;
    
    // Get the task to check project permissions
    const task = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (!task.length) {
      throw new Error("Task not found");
    }
    
    const projectId = task[0].projectId;
    
    // Check if user has permission to view comments
    const hasViewPermission = await hasPermission(
      userId,
      projectId,
      'read',
      'comment'
    );
    
    if (!hasViewPermission) {
      throw new Error("You don't have permission to view comments for this task");
    }
    
    // Get all replies for the comment
    const repliesList = await db
      .select({
        id: comments.id,
        content: comments.content,
        type: comments.type,
        taskId: comments.taskId,
        userId: comments.userId,
        parentId: comments.parentId,
        edited: comments.edited,
        editedAt: comments.editedAt,
        editedBy: comments.editedBy,
        isResolved: comments.isResolved,
        resolvedAt: comments.resolvedAt,
        resolvedBy: comments.resolvedBy,
        metadata: comments.metadata,
        mentions: comments.mentions,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userName: users.name,
        userImage: users.image
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(
        and(
          eq(comments.parentId, commentId),
          eq(comments.taskId, taskId)
        )
      )
      .orderBy(comments.createdAt);
    
    // Get additional user information for edited/resolved comments
    const repliesWithMeta = await Promise.all(
      repliesList.map(async (reply) => {
        let editorName;
        let resolverName;
        
        if (reply.editedBy) {
          const editor = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, reply.editedBy))
            .limit(1);
          
          if (editor.length) {
            editorName = editor[0].name;
          }
        }
        
        if (reply.resolvedBy) {
          const resolver = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, reply.resolvedBy))
            .limit(1);
          
          if (resolver.length) {
            resolverName = resolver[0].name;
          }
        }
        
        return {
          ...reply,
          editorName,
          resolverName
        } as CommentWithMeta;
      })
    );
    
    return repliesWithMeta;
  } catch (error) {
    console.error('Failed to get comment replies:', error);
    throw error;
  }
} 