import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getProjectTasks, createTask } from "@/lib/actions/task-actions";
import { z } from "zod";
import { TaskSortField, SortDirection } from "@/types/task";

// Schema for task creation
const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  type: z.enum(["feature", "bug", "improvement", "documentation", "task", "epic"]).optional(),
  assigneeId: z.number().int().nullable().optional(),
  reporterId: z.number().int().optional(),
  parentTaskId: z.number().int().nullable().optional(),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  points: z.number().optional().nullable(),
  position: z.number().optional().nullable(),
  labels: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string()
    })
  ).optional()
});

// Schema for task filtering
const taskFilterSchema = z.object({
  status: z.array(z.enum(["backlog", "todo", "in_progress", "in_review", "done"])).optional(),
  priority: z.array(z.enum(["low", "medium", "high", "urgent"])).optional(),
  type: z.array(z.enum(["feature", "bug", "improvement", "documentation", "task", "epic"])).optional(),
  assigneeId: z.array(z.number()).optional(),
  reporterId: z.array(z.number()).optional(),
  dueDate: z.object({
    from: z.string().optional(),
    to: z.string().optional()
  }).optional(),
  search: z.string().optional(),
  includeArchived: z.boolean().optional(),
  includeCompleted: z.boolean().optional()
});

// Schema for task sorting
const taskSortSchema = z.object({
  field: z.nativeEnum(TaskSortField),
  direction: z.nativeEnum(SortDirection)
});

// GET /api/projects/[id]/tasks - Get tasks for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    // Parse query parameters for filtering and sorting
    const url = new URL(request.url);
    const filterParams = url.searchParams.get("filter");
    const sortParams = url.searchParams.get("sort");
    
    let filter;
    
    if (filterParams) {
      try {
        const filterData = JSON.parse(filterParams);
        const result = taskFilterSchema.safeParse(filterData);
        if (result.success) {
          // Create a properly typed filter object
          const typedFilter: Record<string, unknown> = { ...result.data };
          
          // Convert date strings to Date objects if present
          if (typedFilter.dueDate) {
            const dueDate = typedFilter.dueDate as Record<string, string>;
            if (dueDate.from) {
              dueDate.from = new Date(dueDate.from).toISOString();
            }
            if (dueDate.to) {
              dueDate.to = new Date(dueDate.to).toISOString();
            }
          }
          
          filter = typedFilter;
        }
      } catch (error) {
        console.error("Error parsing filter parameters:", error);
      }
    }
    
    if (sortParams) {
      try {
        const sortData = JSON.parse(sortParams);
        taskSortSchema.safeParse(sortData);
        // Sort is no longer used since we removed it from getProjectTasks
      } catch (error) {
        console.error("Error parsing sort parameters:", error);
      }
    }
    
    // Get tasks with filtering
    const tasks = await getProjectTasks(projectId, filter);
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error(`Error fetching tasks for project ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("must be logged in")) {
      return NextResponse.json(
        { error: "You must be logged in to view tasks" },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message.includes("don't have access")) {
      return NextResponse.json(
        { error: "You don't have access to this project's tasks" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/tasks - Create a new task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Convert date strings to Date objects if present
    const taskData = {
      ...result.data,
      projectId,
      dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
      startDate: result.data.startDate ? new Date(result.data.startDate) : null
    };
    
    // Create the task
    const task = await createTask(taskData);
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error(`Error creating task for project ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to create tasks in this project" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
} 