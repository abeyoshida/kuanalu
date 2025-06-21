import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organizationMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getOrganizationMembers } from "@/lib/actions/organization-actions";
import { z } from "zod";

// Schema for member role update
const updateMemberSchema = z.object({
  role: z.enum(["owner", "admin", "member", "guest"])
});

// PUT /api/organizations/[id]/members/[userId] - Update member role
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
    
    const organizationId = parseInt(params.id);
    const targetUserId = parseInt(params.userId);
    
    if (isNaN(organizationId) || isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "Invalid organization ID or user ID" },
        { status: 400 }
      );
    }
    
    // Check if the current user is an owner or admin
    const currentUserId = parseInt(session.user.id);
    const currentUserMembership = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, currentUserId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (!currentUserMembership.length || !['owner', 'admin'].includes(currentUserMembership[0].role)) {
      return NextResponse.json(
        { error: "You don't have permission to update member roles" },
        { status: 403 }
      );
    }
    
    // Check if target user is a member
    const targetUserMembership = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, targetUserId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (!targetUserMembership.length) {
      return NextResponse.json(
        { error: "User is not a member of this organization" },
        { status: 404 }
      );
    }
    
    // Validate input
    const body = await request.json();
    const result = updateMemberSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { role } = result.data;
    
    // Only owners can change owner roles
    if (targetUserMembership[0].role === 'owner' && currentUserMembership[0].role !== 'owner') {
      return NextResponse.json(
        { error: "Only owners can change the role of other owners" },
        { status: 403 }
      );
    }
    
    // Update member role
    await db
      .update(organizationMembers)
      .set({ role })
      .where(
        and(
          eq(organizationMembers.userId, targetUserId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );
    
    // Get updated members list
    const updatedMembers = await getOrganizationMembers(organizationId);
    
    return NextResponse.json(updatedMembers);
  } catch (error) {
    console.error(`Error updating member role:`, error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id]/members/[userId] - Remove a member from the organization
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
    
    const organizationId = parseInt(params.id);
    const targetUserId = parseInt(params.userId);
    
    if (isNaN(organizationId) || isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "Invalid organization ID or user ID" },
        { status: 400 }
      );
    }
    
    // Check if the current user is an owner or admin
    const currentUserId = parseInt(session.user.id);
    const currentUserMembership = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, currentUserId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (!currentUserMembership.length) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }
    
    // Check if target user is a member
    const targetUserMembership = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, targetUserId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (!targetUserMembership.length) {
      return NextResponse.json(
        { error: "User is not a member of this organization" },
        { status: 404 }
      );
    }
    
    // Users can remove themselves
    const isSelf = currentUserId === targetUserId;
    
    // Only owners and admins can remove others
    if (!isSelf && !['owner', 'admin'].includes(currentUserMembership[0].role)) {
      return NextResponse.json(
        { error: "You don't have permission to remove members from this organization" },
        { status: 403 }
      );
    }
    
    // Only owners can remove owners
    if (targetUserMembership[0].role === 'owner' && currentUserMembership[0].role !== 'owner') {
      return NextResponse.json(
        { error: "Only owners can remove other owners" },
        { status: 403 }
      );
    }
    
    // Remove the member
    await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, targetUserId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );
    
    // If the user removed themselves, return a success message
    if (isSelf) {
      return NextResponse.json(
        { message: "You have left the organization" },
        { status: 200 }
      );
    }
    
    // Get updated members list
    const updatedMembers = await getOrganizationMembers(organizationId);
    
    return NextResponse.json(updatedMembers);
  } catch (error) {
    console.error(`Error removing member:`, error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
} 