import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from '@/lib/db';
import { tasks, users, projectMembers, projects, subtasks, comments } from '@/lib/db/schema';
import { and, eq, isNull, count, inArray, sql } from 'drizzle-orm';
import { hasPermission } from '@/lib/auth/permissions';
import { PaginatedTasksResult, TaskWithMeta } from '@/types/task';

// GET /api/projects/[id]/tasks - Get tasks for a project
export async function GET(
  request: NextRequest,
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Extract project ID from URL path
    const url = request.url;
    const pathParts = url.split('/');
    const projectIdStr = pathParts[pathParts.indexOf('projects') + 1];
    const projectId = parseInt(projectIdStr);
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    const userId = parseInt(session.user.id);
    
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
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
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
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status')?.split(',') || [];
    const priority = searchParams.get('priority')?.split(',') || [];
    const includeCompleted = searchParams.get('includeCompleted') !== 'false';
    const sortField = searchParams.get('sort') || 'priority';
    const sortDirection = searchParams.get('direction') || 'desc';
    
    // Build where conditions
    const whereConditions = [eq(tasks.projectId, projectId)];
    
    // Add search filter
    if (search) {
      whereConditions.push(
        sql`(${tasks.title} LIKE ${`%${search}%`} OR (${tasks.description} IS NOT NULL AND ${tasks.description} LIKE ${`%${search}%`}))`
      );
    }
    
    // Add status filter
    if (status.length > 0) {
      whereConditions.push(inArray(tasks.status, status as Array<"backlog" | "todo" | "in_progress" | "in_review" | "done">));
    }
    
    // Add priority filter
    if (priority.length > 0) {
      whereConditions.push(inArray(tasks.priority, priority as Array<"low" | "medium" | "high" | "urgent">));
    }
    
    // Add completed filter
    if (!includeCompleted) {
      whereConditions.push(sql`${tasks.status} != 'done'`);
    }
    
    // By default, exclude archived tasks
    whereConditions.push(isNull(tasks.archivedAt));
    
    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(...whereConditions));
    
    const totalItems = Number(totalResult.count);
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = Math.min(Math.max(1, page), Math.max(1, totalPages));
    const offset = (currentPage - 1) * pageSize;
    
    // Get paginated tasks with sorting
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
      .where(and(...whereConditions))
      .limit(pageSize)
      .offset(offset);
    
    // Apply sorting manually after fetching the data
    const sortedTasksList = [...tasksList].sort((a, b) => {
      if (sortField === 'priority') {
        // Map priority to numeric values for sorting
        const priorityMap: Record<string, number> = {
          urgent: 4, high: 3, medium: 2, low: 1
        };
        
        const valueA = priorityMap[a.priority as string] || 0;
        const valueB = priorityMap[b.priority as string] || 0;
        
        // First sort by priority
        if (valueA !== valueB) {
          return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
        }
        
        // Then sort by due date
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      } else if (sortField === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        // Default sort by position
        return (a.position as number || 0) - (b.position as number || 0);
      }
    });
    
    // Get subtask, comment, and child task counts
    const tasksWithMeta = await Promise.all(
      sortedTasksList.map(async (task: Record<string, unknown>) => {
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
    
    // Create pagination result
    const result: PaginatedTasksResult = {
      tasks: tasksWithMeta,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        pageSize
      }
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/tasks - Create a new task
export async function POST(
  request: NextRequest,
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Extract project ID from URL path
    const url = request.url;
    const pathParts = url.split('/');
    const projectIdStr = pathParts[pathParts.indexOf('projects') + 1];
    const projectId = parseInt(projectIdStr);
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    const userId = parseInt(session.user.id);
    
    // Check if user has permission to create tasks in this project
    const hasCreatePermission = await hasPermission(
      userId,
      projectId,
      'create',
      'task'
    );
    
    if (!hasCreatePermission) {
      return NextResponse.json(
        { error: 'You do not have permission to create tasks in this project' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    // Set default values
    const taskData = {
      title: data.title,
      description: data.description || null,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      type: data.type || 'task',
      projectId,
      assigneeId: data.assigneeId || null,
      reporterId: userId,
      parentTaskId: data.parentTaskId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      estimatedHours: data.estimatedHours || null,
      points: data.points || null,
      position: data.position || 0,
      labels: data.labels || [],
      createdBy: userId
    };
    
    // Insert task
    const [newTask] = await db.insert(tasks).values(taskData).returning();
    
    return NextResponse.json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
} 