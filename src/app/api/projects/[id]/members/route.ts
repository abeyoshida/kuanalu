import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getProjectMembers, addProjectMember } from "@/lib/actions/project-actions";
import { z } from "zod";

// Schema for adding a project member
const addMemberSchema = z.object({
  userId: z.number().int().positive("User ID is required"),
  role: z.enum(["owner", "admin", "member", "guest"]).default("member")
});

// GET /api/projects/[id]/members - Get project members
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
    
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    const members = await getProjectMembers(projectId);
    
    return NextResponse.json(members);
  } catch (error) {
    console.error(`Error fetching project members for ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have access")) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch project members" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/members - Add a member to the project
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
    
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = addMemberSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Add member to project
    await addProjectMember({
      projectId,
      userId: result.data.userId,
      role: result.data.role
    });
    
    // Get updated members list
    const updatedMembers = await getProjectMembers(projectId);
    
    return NextResponse.json(updatedMembers, { status: 201 });
  } catch (error) {
    console.error(`Error adding member to project ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to add members to this project" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("already a member")) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to add member to project" },
      { status: 500 }
    );
  }
} 