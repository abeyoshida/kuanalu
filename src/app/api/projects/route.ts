import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { hasPermission } from "@/lib/auth/permissions";

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = parseInt(session.user.id);
    const { name, description, organizationId } = await request.json();
    
    if (!name || !organizationId) {
      return NextResponse.json(
        { error: "Name and organization ID are required" },
        { status: 400 }
      );
    }
    
    // Check if user has permission to create projects in this organization
    const canCreateProject = await hasPermission(
      userId,
      organizationId,
      'create',
      'project'
    );
    
    if (!canCreateProject) {
      return NextResponse.json(
        { error: "You don't have permission to create projects in this organization" },
        { status: 403 }
      );
    }
    
    // Create the project
    const [project] = await db
      .insert(projects)
      .values({
        name,
        description,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 