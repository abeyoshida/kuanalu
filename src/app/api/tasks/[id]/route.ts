import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getTaskById, updateTask, deleteTask } from "@/lib/actions/task-actions";
import { z } from "zod";
import { UpdateTaskInput } from "@/types/task";

// Schema for task update
const updateTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  type: z.enum(["feature", "bug", "improvement", "documentation", "task", "epic"]).optional(),
  assigneeId: z.number().int().nullable().optional(),
  reporterId: z.number().int().nullable().optional(),
  parentTaskId: z.number().int().nullable().optional(),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  actualHours: z.number().optional().nullable(),
  points: z.number().optional().nullable(),
  position: z.number().optional().nullable(),
  labels: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string()
    })
  ).optional(),
  metadata: z.record(z.unknown()).optional(),
  archived: z.boolean().optional()
});

// GET /api/tasks/[id] - Get task details
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
    
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }
    
    const task = await getTaskById(taskId);
    
    return NextResponse.json(task);
  } catch (error) {
    console.error(`Error fetching task ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("must be logged in")) {
      return NextResponse.json(
        { error: "You must be logged in to view task details" },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message.includes("don't have access")) {
      return NextResponse.json(
        { error: "You don't have access to this task" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update task details
export async function PUT(
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
    
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = updateTaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Convert date strings to Date objects if present
    const updateData: UpdateTaskInput = {
      ...result.data,
      dueDate: result.data.dueDate ? new Date(result.data.dueDate) : (result.data.dueDate === null ? null : undefined),
      startDate: result.data.startDate ? new Date(result.data.startDate) : (result.data.startDate === null ? null : undefined)
    };
    
    // Update the task
    const updatedTask = await updateTask(taskId, updateData);
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error(`Error updating task ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to update this task" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
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
    
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }
    
    await deleteTask(taskId);
    
    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting task ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to delete this task" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
} 