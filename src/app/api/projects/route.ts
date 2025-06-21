import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createProject } from "@/lib/actions/project-actions";
import { z } from "zod";

// Schema for project creation
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  organizationId: z.number().int().positive("Organization ID is required"),
  status: z.enum(["planning", "active", "on_hold", "completed", "canceled"]).default("planning"),
  visibility: z.enum(["public", "private", "team_only"]).default("private"),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  icon: z.string().optional(),
  color: z.string().optional()
});

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = createProjectSchema.safeParse(body);
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
    
    // Use the existing server action
    const project = await createProject(formData);
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to create a project in this organization" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
} 