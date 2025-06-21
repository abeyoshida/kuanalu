import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { updateTaskPositions } from "@/lib/actions/task-actions";
import { z } from "zod";

// Schema for task position update
const updatePositionSchema = z.object({
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done"]),
  position: z.number().int().min(0)
});

// PATCH /api/tasks/[id]/position - Update task position
export async function PATCH(
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
    const result = updatePositionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Update task position
    await updateTaskPositions(taskId, result.data.status, result.data.position);
    
    return NextResponse.json(
      { message: "Task position updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error updating task position for ${params.id}:`, error);
    
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
      { error: "Failed to update task position" },
      { status: 500 }
    );
  }
} 