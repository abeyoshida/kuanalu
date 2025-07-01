import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { 
  getProjectMembers, 
  removeProjectMember 
} from "@/lib/actions/project-actions";
import { z } from "zod";
import { db } from "@/lib/db";
import { projectMembers, projects } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { hasPermission } from "@/lib/auth/permissions";

// Schema for updating a project member's role
const updateRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member", "guest"])
});

// PUT /api/projects/[id]/members/[userId] - Update a member's role in the project
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
    
    const currentUserId = parseInt(session.user.id);
    
    // Check if the current user is trying to update their own role
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: "You cannot update your own role" },
        { status: 403 }
      );
    }
    
    // Get the project to check permissions
    const project = await db
      .select({
        organizationId: projects.organizationId,
        ownerId: projects.ownerId
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
      .then((results) => results[0]);
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update roles
    const hasUpdatePermission = await hasPermission(
      currentUserId,
      project.organizationId,
      'update-role',
      'user'
    );
    
    if (!hasUpdatePermission) {
      return NextResponse.json(
        { error: "You don't have permission to update user roles in this project" },
        { status: 403 }
      );
    }
    
    // Cannot change the project owner's role
    if (targetUserId === project.ownerId) {
      return NextResponse.json(
        { error: "Cannot change the project owner's role" },
        { status: 403 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const result = updateRoleSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Update the user's role
    await db
      .update(projectMembers)
      .set({
        role: result.data.role
      })
      .where(
        and(
          eq(projectMembers.userId, targetUserId),
          eq(projectMembers.projectId, projectId)
        )
      );
    
    // Get updated members list
    const updatedMembers = await getProjectMembers(projectId);
    
    return NextResponse.json(updatedMembers);
  } catch (error) {
    console.error(`Error updating project member role:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to update roles in this project" },
        { status: 403 }
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