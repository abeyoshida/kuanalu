import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { removeCategoryFromProject } from "@/lib/actions/project-actions";
import { db } from "@/lib/db";
import { projectCategoryAssignments, projectCategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// DELETE /api/projects/[id]/categories/[categoryId] - Remove a category from a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
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
    const categoryId = parseInt(params.categoryId);
    
    if (isNaN(projectId) || isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Invalid project ID or category ID" },
        { status: 400 }
      );
    }
    
    // Remove category from project
    await removeCategoryFromProject(projectId, categoryId);
    
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
    
    return NextResponse.json(updatedCategories);
  } catch (error) {
    console.error(`Error removing category from project:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to remove categories from this project" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("not assigned")) {
      return NextResponse.json(
        { error: "Category is not assigned to this project" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to remove category from project" },
      { status: 500 }
    );
  }
} 