import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { 
  getProjectMembers, 
  addProjectMember, 
  removeProjectMember 
} from "@/lib/actions/project-actions";
import { z } from "zod";

// Schema for updating a project member's role
const updateMemberSchema = z.object({
  role: z.enum(["owner", "admin", "member", "guest"])
});

// PUT /api/projects/[id]/members/[userId] - Update a member's role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const projectId = parseInt(params.id);
    const targetUserId = parseInt(params.userId);
    
    if (isNaN(projectId) || isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "Invalid project ID or user ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = updateMemberSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Update member role using addProjectMember (which handles updates)
    await addProjectMember({
      projectId,
      userId: targetUserId,
      role: result.data.role
    });
    
    // Get updated members list
    const updatedMembers = await getProjectMembers(projectId);
    
    return NextResponse.json(updatedMembers);
  } catch (error) {
    console.error(`Error updating project member role:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to update member roles" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Project or user not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/members/[userId] - Remove a member from the project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const projectId = parseInt(params.id);
    const targetUserId = parseInt(params.userId);
    
    if (isNaN(projectId) || isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "Invalid project ID or user ID" },
        { status: 400 }
      );
    }
    
    // Remove the member
    await removeProjectMember(projectId, targetUserId);
    
    // Check if the user removed themselves
    const currentUserId = parseInt(session.user.id);
    const isSelf = currentUserId === targetUserId;
    
    if (isSelf) {
      return NextResponse.json(
        { message: "You have left the project" },
        { status: 200 }
      );
    }
    
    // Get updated members list
    const updatedMembers = await getProjectMembers(projectId);
    
    return NextResponse.json(updatedMembers);
  } catch (error) {
    console.error(`Error removing project member:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to remove members from this project" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Project or user not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
} 