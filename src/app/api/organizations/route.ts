import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createOrganization, getUserOrganizations } from "@/lib/actions/organization-actions";
import { z } from "zod";

// Schema for organization creation
const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
  visibility: z.enum(["public", "private"]).default("private"),
  logo: z.string().optional(),
  website: z.string().optional()
});

// GET /api/organizations - List all organizations for the current user
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const organizations = await getUserOrganizations();
    
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create a new organization
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
    const result = createOrgSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Convert to FormData for compatibility with existing server action
    const formData = new FormData();
    Object.entries(result.data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    
    // Use the existing server action
    const organization = await createOrganization(formData);
    
    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
} 