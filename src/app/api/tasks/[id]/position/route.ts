import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateRequestBody } from "@/lib/validation/api-validation";
import { validateTaskPermission } from "@/lib/validation/permission-validation";
import { updateTaskPositions } from "@/lib/actions/task-actions";
import { auth } from "@/lib/auth/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const taskId = parseInt(params.id);
    
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }
    
    // Validate request body
    const schema = z.object({
      newStatus: z.enum(["todo", "today", "in_progress", "in_review", "done"]),
      newPosition: z.number().int().min(0)
    });
    const validation = await validateRequestBody(request, schema);
    if ('error' in validation) return validation.error;
    
    const { newStatus, newPosition } = validation.data;
    
    // Validate permission
    const permissionCheck = await validateTaskPermission(session, taskId, 'update');
    if (permissionCheck) return permissionCheck;
    
    // Update task position
    await updateTaskPositions(taskId, newStatus, newPosition);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating task position:", error);
    return NextResponse.json(
      { error: "Failed to update task position" },
      { status: 500 }
    );
  }
} 