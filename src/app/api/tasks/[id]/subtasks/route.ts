import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getTaskSubtasks, createSubtask } from "@/lib/actions/subtask-actions";
import { z } from "zod";

// Schema for subtask creation
const createSubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required"),
  description: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.number().int().nullable().optional(),
  estimatedHours: z.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  position: z.number().optional().nullable(),
  metadata: z.record(z.unknown()).optional()
});

// GET /api/tasks/[id]/subtasks - Get subtasks for a task
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
    
    const subtasks = await getTaskSubtasks(taskId);
    
    return NextResponse.json(subtasks);
  } catch (error) {
    console.error(`Error fetching subtasks for task ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("must be logged in")) {
      return NextResponse.json(
        { error: "You must be logged in to view subtasks" },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to view subtasks for this task" },
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
      { error: "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/subtasks - Create a new subtask
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
    
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = createSubtaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Convert date strings to Date objects if present
    const subtaskData = {
      ...result.data,
      taskId,
      dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
      assigneeId: result.data.assigneeId === null ? undefined : result.data.assigneeId,
      estimatedHours: result.data.estimatedHours === null ? undefined : result.data.estimatedHours,
      position: result.data.position === null ? undefined : result.data.position
    };
    
    // Create the subtask
    const subtask = await createSubtask(subtaskData);
    
    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    console.error(`Error creating subtask for task ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to create subtasks for this task" },
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
      { error: "Failed to create subtask" },
      { status: 500 }
    );
  }
} 