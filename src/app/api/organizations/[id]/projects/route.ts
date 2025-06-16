import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { projects, organizationMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = parseInt(session.user.id);
    const organizationId = parseInt(params.id);
    
    // Check if user is a member of the organization
    const membership = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (!membership.length) {
      return NextResponse.json(
        { error: "You don't have access to this organization" },
        { status: 403 }
      );
    }
    
    // Get all projects for the organization
    const organizationProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, organizationId))
      .orderBy(projects.createdAt);
    
    return NextResponse.json({ projects: organizationProjects });
  } catch (error) {
    console.error("Error fetching organization projects:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 