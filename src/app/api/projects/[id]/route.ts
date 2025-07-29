import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { 
  getProjectById, 
  updateProject,
  deleteProject
} from "@/lib/actions/project-actions";
import { z } from "zod";

// Schema for project update
const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").optional(),
  description: z.string().optional(),
  status: z.enum(["planning", "active", "on_hold", "completed", "canceled"]).optional(),
  visibility: z.enum(["public", "private", "team_only"]).optional(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  completedDate: z.string().optional().nullable(),
  icon: z.string().optional(),
  color: z.string().optional(),
  settings: z.record(z.unknown()).optional()
});

// GET /api/projects/[id] - Get project details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Await params in Next.js 15
    const { id } = await params;
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    const project = await getProjectById(projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(project);
  } catch (error) {
    const { id } = await params;
    console.error(`Error fetching project ${id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have access")) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Await params in Next.js 15
    const { id } = await params;
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = updateProjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Convert to FormData for compatibility with existing server action
    const formData = new FormData();
    Object.entries(result.data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    await updateProject(projectId, formData);
    
    // Return the updated project
    const updatedProject = await getProjectById(projectId);
    return NextResponse.json(updatedProject);
  } catch (error) {
    const { id } = await params;
    console.error(`Error updating project ${id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to update this project" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Await params in Next.js 15
    const { id } = await params;
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    await deleteProject(projectId);
    
    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const { id } = await params;
    console.error(`Error deleting project ${id}:`, error);
    
    // Check for permission/access errors
    if (error instanceof Error && 
        (error.message.includes("don't have permission") || 
         error.message.includes("don't have access"))) {
      return NextResponse.json(
        { error: "You don't have permission to delete this project" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
} 