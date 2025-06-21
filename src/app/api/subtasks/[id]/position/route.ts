import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { updateSubtaskPositions } from "@/lib/actions/subtask-actions";
import { z } from "zod";

// Schema for position updates
const updatePositionSchema = z.object({
  position: z.number().int().min(0, "Position must be a non-negative integer")
});

// PATCH /api/subtasks/[id]/position - Update subtask position
export async function PATCH(
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
    
    const subtaskId = parseInt(params.id);
    if (isNaN(subtaskId)) {
      return NextResponse.json(
        { error: "Invalid subtask ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = updatePositionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Update the subtask position
    await updateSubtaskPositions(subtaskId, result.data.position);
    
    return NextResponse.json(
      { message: "Subtask position updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error updating position for subtask ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("must be logged in")) {
      return NextResponse.json(
        { error: "You must be logged in to update subtask positions" },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to update this subtask's position" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Subtask not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update subtask position" },
      { status: 500 }
    );
  }
} 