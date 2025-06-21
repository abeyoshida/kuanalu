import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getTaskComments, createComment } from "@/lib/actions/comment-actions";
import { 
  validateAuthentication, 
  validateNumericParam,
  validateRequestBody,
  handleApiError
} from "@/lib/validation/api-validation";
import { createCommentSchema } from "@/types/comment";

// GET /api/tasks/[id]/comments - Get all comments for a task
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
    
    // Get comments for the task
    const comments = await getTaskComments(taskIdResult);
    
    return NextResponse.json(comments);
  } catch (error) {
    return handleApiError(error, "comments");
  }
}

// POST /api/tasks/[id]/comments - Create a new comment
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
    const validation = await validateRequestBody(request, createCommentSchema);
    if ('error' in validation) return validation.error;
    
    // Ensure taskId matches the URL parameter
    if (validation.data.taskId !== taskIdResult) {
      return NextResponse.json(
        { error: "Task ID in body must match task ID in URL" },
        { status: 400 }
      );
    }
    
    // Create the comment with properly typed parentId
    const commentData = {
      ...validation.data,
      parentId: validation.data.parentId || undefined
    };
    
    const comment = await createComment(commentData);
    
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return handleApiError(error, "comment");
  }
} 