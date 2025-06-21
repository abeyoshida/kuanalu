import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { projectCategoryAssignments, projectCategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { assignCategoryToProject } from "@/lib/actions/project-actions";
import { z } from "zod";

// Schema for adding a category to a project
const addCategorySchema = z.object({
  categoryId: z.number().int().positive("Category ID is required")
});

// GET /api/projects/[id]/categories - Get project categories
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
    
    // Get categories assigned to this project
    const categories = await db
      .select({
        id: projectCategories.id,
        name: projectCategories.name,
        description: projectCategories.description,
        color: projectCategories.color,
        organizationId: projectCategories.organizationId,
        createdBy: projectCategories.createdBy,
        createdAt: projectCategories.createdAt,
        updatedAt: projectCategories.updatedAt
      })
      .from(projectCategoryAssignments)
      .innerJoin(
        projectCategories,
        eq(projectCategoryAssignments.categoryId, projectCategories.id)
      )
      .where(eq(projectCategoryAssignments.projectId, projectId));
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error(`Error fetching project categories for ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch project categories" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/categories - Add a category to the project
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
    const result = addCategorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Add category to project
    await assignCategoryToProject(projectId, result.data.categoryId);
    
    // Get updated categories list
    const updatedCategories = await db
      .select({
        id: projectCategories.id,
        name: projectCategories.name,
        description: projectCategories.description,
        color: projectCategories.color,
        organizationId: projectCategories.organizationId,
        createdBy: projectCategories.createdBy,
        createdAt: projectCategories.createdAt,
        updatedAt: projectCategories.updatedAt
      })
      .from(projectCategoryAssignments)
      .innerJoin(
        projectCategories,
        eq(projectCategoryAssignments.categoryId, projectCategories.id)
      )
      .where(eq(projectCategoryAssignments.projectId, projectId));
    
    return NextResponse.json(updatedCategories, { status: 201 });
  } catch (error) {
    console.error(`Error adding category to project ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to add categories to this project" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("already assigned")) {
      return NextResponse.json(
        { error: "Category is already assigned to this project" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to add category to project" },
      { status: 500 }
    );
  }
} 