import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSubtaskById, updateSubtask, deleteSubtask } from "@/lib/actions/subtask-actions";
import { z } from "zod";

// Schema for subtask updates
const updateSubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required").optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  priority: z.string().nullable().optional(),
  assigneeId: z.number().int().nullable().optional(),
  estimatedHours: z.number().nullable().optional(),
  actualHours: z.number().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  position: z.number().optional(),
  metadata: z.record(z.unknown()).optional()
});

// GET /api/subtasks/[id] - Get a specific subtask
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
    
    const subtaskId = parseInt(params.id);
    if (isNaN(subtaskId)) {
      return NextResponse.json(
        { error: "Invalid subtask ID" },
        { status: 400 }
      );
    }
    
    const subtask = await getSubtaskById(subtaskId);
    
    if (!subtask) {
      return NextResponse.json(
        { error: "Subtask not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(subtask);
  } catch (error) {
    console.error(`Error fetching subtask ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("must be logged in")) {
      return NextResponse.json(
        { error: "You must be logged in to view subtask details" },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to view this subtask" },
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
      { error: "Failed to fetch subtask" },
      { status: 500 }
    );
  }
}

// PATCH /api/subtasks/[id] - Update a subtask
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
    const result = updateSubtaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Process data and handle null/undefined values
    const updateData = {
      ...result.data,
      // Convert date strings to Date objects if present
      dueDate: result.data.dueDate === null 
        ? null 
        : (result.data.dueDate ? new Date(result.data.dueDate) : undefined)
    };
    
    // Update the subtask
    const updatedSubtask = await updateSubtask(subtaskId, updateData);
    
    return NextResponse.json(updatedSubtask);
  } catch (error) {
    console.error(`Error updating subtask ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("must be logged in")) {
      return NextResponse.json(
        { error: "You must be logged in to update a subtask" },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to update this subtask" },
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
      { error: "Failed to update subtask" },
      { status: 500 }
    );
  }
}

// DELETE /api/subtasks/[id] - Delete a subtask
export async function DELETE(
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
    
    await deleteSubtask(subtaskId);
    
    return NextResponse.json(
      { message: "Subtask deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting subtask ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("must be logged in")) {
      return NextResponse.json(
        { error: "You must be logged in to delete a subtask" },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to delete this subtask" },
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
      { error: "Failed to delete subtask" },
      { status: 500 }
    );
  }
} 