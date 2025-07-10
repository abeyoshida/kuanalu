import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { updateTaskPositions } from "@/lib/actions/task-actions";
import { z } from "zod";
import { 
  validateAuthentication, 
  validateNumericParam,
  validateRequestBody,
  handleApiError
} from "@/lib/validation/api-validation";

// Schema for task position update
const updatePositionSchema = z.object({
  newStatus: z.enum(["todo", "today", "in_progress", "in_review", "done"]),
  newPosition: z.number().int().min(0)
});

// PATCH /api/tasks/[id]/position - Update task position
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Validate authentication
    const authError = validateAuthentication(session);
    if (authError) return authError;
    
    // Validate task ID
    const taskIdResult = validateNumericParam(params.id, "task ID");
    if (typeof taskIdResult !== 'number') {
      return taskIdResult;
    }
    
    // Validate request body
    const schema = z.object({
      newStatus: z.enum(["todo", "today", "in_progress", "in_review", "done"]),
      newPosition: z.number().int().min(0)
    });
    const validation = await validateRequestBody(request, schema);
    if ('error' in validation) return validation.error;
    
    const { newStatus, newPosition } = validation.data;
    
    // Update task position
    await updateTaskPositions(taskIdResult, newStatus, newPosition);
    
    return NextResponse.json(
      { message: "Task position updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "task position");
  }
} 