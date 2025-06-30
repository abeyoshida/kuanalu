import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createTask } from "@/lib/actions/task-actions";
import { 
  validateAuthentication, 
  validateRequestBody,
  handleApiError
} from "@/lib/validation/api-validation";
import { validateProjectPermission } from "@/lib/validation/permission-validation";
import { createTaskSchema, convertToCreateTaskInput } from "@/types/task";

// GET /api/tasks - Get tasks (with filters)
export async function GET() {
  try {
    const session = await auth();
    
    // Validate authentication
    const authError = validateAuthentication(session);
    if (authError) return authError;
    
    // This endpoint should redirect to project-specific tasks
    return NextResponse.json(
      { error: "Please use /api/projects/[id]/tasks to get tasks for a specific project" },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error, "tasks");
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Validate authentication
    const authError = validateAuthentication(session);
    if (authError) return authError;
    
    // Validate request body
    const validation = await validateRequestBody(request, createTaskSchema);
    if ('error' in validation) return validation.error;
    
    // Convert schema data to CreateTaskInput
    const taskData = convertToCreateTaskInput(validation.data);
    
    // Validate permission for the project
    const permissionError = await validateProjectPermission(session, taskData.projectId, 'create');
    if (permissionError) return permissionError;
    
    // Create the task
    const task = await createTask(taskData);
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleApiError(error, "task");
  }
} 