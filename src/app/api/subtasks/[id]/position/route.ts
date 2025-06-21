import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { updateSubtaskPositions } from "@/lib/actions/subtask-actions";
import { 
  validateAuthentication, 
  validateNumericParam,
  validateRequestBody,
  handleApiError
} from "@/lib/validation/api-validation";
import { updateSubtaskPositionSchema } from "@/types/subtask";

// PATCH /api/subtasks/[id]/position - Update subtask position
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Validate authentication
    const authError = validateAuthentication(session);
    if (authError) return authError;
    
    // Validate subtask ID
    const subtaskIdResult = validateNumericParam(params.id, "subtask ID");
    if (typeof subtaskIdResult !== 'number') {
      return subtaskIdResult;
    }
    
    // Validate request body
    const validation = await validateRequestBody(request, updateSubtaskPositionSchema);
    if ('error' in validation) return validation.error;
    
    const { newPosition } = validation.data;
    
    // Update subtask position
    await updateSubtaskPositions(subtaskIdResult, newPosition);
    
    return NextResponse.json(
      { message: "Subtask position updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "subtask position");
  }
} 