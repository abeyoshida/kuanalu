import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { hasPermission, hasMultiplePermissions, hasAnyPermission } from "@/lib/auth/permissions";

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { organizationId, action, subject, permissions, type } = body;
    
    // Validate required parameters
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    const userId = parseInt(session.user.id);
    
    // Check if the requesting user is the same as the user in the session
    if (body.userId && parseInt(body.userId) !== userId) {
      return NextResponse.json(
        { error: "Cannot check permissions for another user" },
        { status: 403 }
      );
    }
    
    let result = false;
    
    // Check permission type
    if (type === 'multiple' && Array.isArray(permissions)) {
      // Check multiple permissions (all must be true)
      result = await hasMultiplePermissions(userId, organizationId, permissions);
    } else if (type === 'any' && Array.isArray(permissions)) {
      // Check any permission (at least one must be true)
      result = await hasAnyPermission(userId, organizationId, permissions);
    } else if (action && subject) {
      // Check single permission
      result = await hasPermission(userId, organizationId, action, subject);
    } else {
      return NextResponse.json(
        { error: "Invalid permission check parameters" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ hasPermission: result });
  } catch (error) {
    console.error("Permission check error:", error);
    
    return NextResponse.json(
      { error: "An error occurred while checking permissions" },
      { status: 500 }
    );
  }
} 