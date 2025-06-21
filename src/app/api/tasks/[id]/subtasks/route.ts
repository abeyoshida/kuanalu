import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getTaskSubtasks, createSubtask } from "@/lib/actions/subtask-actions";
import { 
  validateAuthentication, 
  validateNumericParam,
  validateRequestBody,
  handleApiError
} from "@/lib/validation/api-validation";
import { createSubtaskSchema } from "@/types/subtask";

// GET /api/tasks/[id]/subtasks - Get all subtasks for a task
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
    
    // Get subtasks for the task
    const subtasks = await getTaskSubtasks(taskIdResult);
    
    return NextResponse.json(subtasks);
  } catch (error) {
    return handleApiError(error, "subtasks");
  }
}

// POST /api/tasks/[id]/subtasks - Create a new subtask
export async function POST(
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
    const validation = await validateRequestBody(request, createSubtaskSchema);
    if ('error' in validation) return validation.error;
    
    // Prepare data with proper null handling
    const data = validation.data;
    const subtaskData = {
      title: data.title,
      description: data.description,
      completed: data.completed ?? false,
      priority: data.priority,
      taskId: taskIdResult,
      assigneeId: data.assigneeId === null ? undefined : data.assigneeId,
      estimatedHours: data.estimatedHours === null ? undefined : data.estimatedHours,
      actualHours: data.actualHours === null ? undefined : data.actualHours,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      position: data.position === null ? undefined : data.position,
      metadata: data.metadata
    };
    
    // Create the subtask
    const subtask = await createSubtask(subtaskData);
    
    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    return handleApiError(error, "subtask");
  }
} 