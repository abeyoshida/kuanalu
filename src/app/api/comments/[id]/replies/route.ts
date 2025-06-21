import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCommentReplies } from "@/lib/actions/comment-actions";
import { 
  validateAuthentication, 
  validateNumericParam,
  handleApiError
} from "@/lib/validation/api-validation";

// GET /api/comments/[id]/replies - Get replies for a comment
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
    
    // Get replies for the comment
    const replies = await getCommentReplies(commentIdResult);
    
    return NextResponse.json(replies);
  } catch (error) {
    return handleApiError(error, "comment replies");
  }
} 