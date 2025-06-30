import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getTaskById, updateTask, deleteTask } from "@/lib/actions/task-actions";
import { 
  validateAuthentication, 
  validateNumericParam,
  validateRequestBody,
  handleApiError
} from "@/lib/validation/api-validation";
import { validateTaskPermission } from "@/lib/validation/permission-validation";
import { updateTaskSchema, convertToUpdateTaskInput } from "@/types/task";

// GET /api/tasks/[id] - Get a specific task
export async function GET(
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
    
    // Validate permission
    const permissionError = await validateTaskPermission(session, taskIdResult, 'read');
    if (permissionError) return permissionError;
    
    // Get the task
    const task = await getTaskById(taskIdResult);
    
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(task);
  } catch (error) {
    return handleApiError(error, "task");
  }
}

// PATCH /api/tasks/[id] - Update a task
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
    
    // Validate permission
    const permissionError = await validateTaskPermission(session, taskIdResult, 'update');
    if (permissionError) return permissionError;
    
    // Validate request body
    const validation = await validateRequestBody(request, updateTaskSchema);
    if ('error' in validation) return validation.error;
    
    // Convert schema data to UpdateTaskInput
    const updateData = convertToUpdateTaskInput(validation.data);
    
    // Update the task
    const updatedTask = await updateTask(taskIdResult, updateData);
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    return handleApiError(error, "task");
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
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
    
    // Validate permission
    const permissionError = await validateTaskPermission(session, taskIdResult, 'delete');
    if (permissionError) return permissionError;
    
    // Delete the task
    await deleteTask(taskIdResult);
    
    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "task");
  }
} 