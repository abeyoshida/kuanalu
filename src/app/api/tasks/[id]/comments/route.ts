import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getTaskComments, createComment } from "@/lib/actions/comment-actions";
import { z } from "zod";

// Schema for comment creation
const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  type: z.enum(['text', 'code', 'attachment', 'system', 'mention']).optional(),
  parentId: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
  mentions: z.array(z.string()).optional()
});

// GET /api/tasks/[id]/comments - Get comments for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }
    
    const comments = await getTaskComments(taskId);
    
    return NextResponse.json(comments);
  } catch (error) {
    console.error(`Error fetching comments for task ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("must be logged in")) {
      return NextResponse.json(
        { error: "You must be logged in to view comments" },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to view comments for this task" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = createCommentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Create the comment
    const comment = await createComment({
      ...result.data,
      taskId
    });
    
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error(`Error creating comment for task ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to comment on this task" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Task or parent comment not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
} 