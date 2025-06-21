import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getOrganizationMembers } from "@/lib/actions/organization-actions";
import { db } from "@/lib/db";
import { organizationMembers, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// GET /api/organizations/[id]/members - Get organization members
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
    
    const organizationId = parseInt(params.id);
    if (isNaN(organizationId)) {
      return NextResponse.json(
        { error: "Invalid organization ID" },
        { status: 400 }
      );
    }
    
    // Check if user is a member of the organization
    const userId = parseInt(session.user.id);
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
    
    // Get organization members
    const members = await getOrganizationMembers(organizationId);
    
    return NextResponse.json(members);
  } catch (error) {
    console.error(`Error fetching organization members for ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch organization members" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/members - Add a member to the organization
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
    
    const organizationId = parseInt(params.id);
    if (isNaN(organizationId)) {
      return NextResponse.json(
        { error: "Invalid organization ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { email, role = 'member' } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Check if user is authorized to add members
    const userId = parseInt(session.user.id);
    const membership = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (!membership.length || !['owner', 'admin'].includes(membership[0].role)) {
      return NextResponse.json(
        { error: "You don't have permission to add members to this organization" },
        { status: 403 }
      );
    }
    
    // Check if user exists
    const userToAdd = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!userToAdd.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if user is already a member
    const existingMembership = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userToAdd[0].id),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (existingMembership.length) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 400 }
      );
    }
    
    // Add user to organization
    await db
      .insert(organizationMembers)
      .values({
        userId: userToAdd[0].id,
        organizationId,
        role: role as 'owner' | 'admin' | 'member' | 'guest',
        invitedBy: userId,
        joinedAt: new Date(),
        createdAt: new Date()
      });
    
    // Get updated members list
    const updatedMembers = await getOrganizationMembers(organizationId);
    
    return NextResponse.json(updatedMembers, { status: 201 });
  } catch (error) {
    console.error(`Error adding member to organization ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to add member to organization" },
      { status: 500 }
    );
  }
} 