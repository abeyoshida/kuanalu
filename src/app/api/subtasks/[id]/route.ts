import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSubtaskById, updateSubtask, deleteSubtask } from "@/lib/actions/subtask-actions";
import { 
  validateAuthentication, 
  validateNumericParam,
  validateRequestBody,
  handleApiError
} from "@/lib/validation/api-validation";
import { validateSubtaskPermission } from "@/lib/validation/permission-validation";
import { updateSubtaskSchema, convertToUpdateSubtaskInput } from "@/types/subtask";

// GET /api/subtasks/[id] - Get a specific subtask
export async function GET(
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
    
    // Validate permission
    const permissionError = await validateSubtaskPermission(session, subtaskIdResult, 'read');
    if (permissionError) return permissionError;
    
    // Get the subtask
    const subtask = await getSubtaskById(subtaskIdResult);
    
    if (!subtask) {
      return NextResponse.json(
        { error: "Subtask not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(subtask);
  } catch (error) {
    return handleApiError(error, "subtask");
  }
}

// PATCH /api/subtasks/[id] - Update a subtask
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
    
    // Validate permission
    const permissionError = await validateSubtaskPermission(session, subtaskIdResult, 'update');
    if (permissionError) return permissionError;
    
    // Validate request body
    const validation = await validateRequestBody(request, updateSubtaskSchema);
    if ('error' in validation) return validation.error;
    
    // Convert schema data to UpdateSubtaskInput and ensure position is not null
    const updateData = {
      ...convertToUpdateSubtaskInput(validation.data),
      position: validation.data.position === null ? undefined : validation.data.position
    };
    
    // Update the subtask
    const updatedSubtask = await updateSubtask(subtaskIdResult, updateData);
    
    return NextResponse.json(updatedSubtask);
  } catch (error) {
    return handleApiError(error, "subtask");
  }
}

// DELETE /api/subtasks/[id] - Delete a subtask
export async function DELETE(
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
    
    // Validate permission
    const permissionError = await validateSubtaskPermission(session, subtaskIdResult, 'delete');
    if (permissionError) return permissionError;
    
    // Delete the subtask
    await deleteSubtask(subtaskIdResult);
    
    return NextResponse.json(
      { message: "Subtask deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "subtask");
  }
} 