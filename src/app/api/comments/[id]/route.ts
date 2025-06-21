import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCommentById, updateComment, deleteComment } from "@/lib/actions/comment-actions";
import { 
  validateAuthentication, 
  validateNumericParam,
  validateRequestBody,
  handleApiError
} from "@/lib/validation/api-validation";
import { updateCommentSchema } from "@/types/comment";

// GET /api/comments/[id] - Get a specific comment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Validate authentication
    const authError = validateAuthentication(session);
    if (authError) return authError;
    
    // Validate comment ID
    const commentIdResult = validateNumericParam(params.id, "comment ID");
    if (typeof commentIdResult !== 'number') {
      return commentIdResult;
    }
    
    // Get the comment
    const comment = await getCommentById(commentIdResult);
    
    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(comment);
  } catch (error) {
    return handleApiError(error, "comment");
  }
}

// PATCH /api/comments/[id] - Update a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Validate authentication
    const authError = validateAuthentication(session);
    if (authError) return authError;
    
    // Validate comment ID
    const commentIdResult = validateNumericParam(params.id, "comment ID");
    if (typeof commentIdResult !== 'number') {
      return commentIdResult;
    }
    
    // Validate request body
    const validation = await validateRequestBody(request, updateCommentSchema);
    if ('error' in validation) return validation.error;
    
    // Update the comment
    const updatedComment = await updateComment(commentIdResult, validation.data);
    
    return NextResponse.json(updatedComment);
  } catch (error) {
    return handleApiError(error, "comment");
  }
}

// DELETE /api/comments/[id] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Validate authentication
    const authError = validateAuthentication(session);
    if (authError) return authError;
    
    // Validate comment ID
    const commentIdResult = validateNumericParam(params.id, "comment ID");
    if (typeof commentIdResult !== 'number') {
      return commentIdResult;
    }
    
    // Delete the comment
    await deleteComment(commentIdResult);
    
    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "comment");
  }
} 