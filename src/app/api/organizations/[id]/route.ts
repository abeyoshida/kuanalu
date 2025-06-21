import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { 
  getOrganizationById, 
  updateOrganization, 
  deleteOrganization 
} from "@/lib/actions/organization-actions";
import { z } from "zod";

// Schema for organization update
const updateOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required").optional(),
  description: z.string().optional(),
  visibility: z.enum(["public", "private"]).optional(),
  logo: z.string().optional(),
  website: z.string().optional()
});

// GET /api/organizations/[id] - Get organization details
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
    
    const organization = await getOrganizationById(organizationId);
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error(`Error fetching organization ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have access")) {
      return NextResponse.json(
        { error: "You don't have access to this organization" },
        { status: 403 }
      );
    }
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/[id] - Update organization details
export async function PUT(
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
    
    // Validate input
    const result = updateOrgSchema.safeParse(body);
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
    await updateOrganization(organizationId, formData);
    
    // Fetch the updated organization
    const updatedOrg = await getOrganizationById(organizationId);
    
    return NextResponse.json(updatedOrg);
  } catch (error) {
    console.error(`Error updating organization ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to update this organization" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id] - Delete an organization
export async function DELETE(
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
    
    await deleteOrganization(organizationId);
    
    return NextResponse.json(
      { message: "Organization deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting organization ${params.id}:`, error);
    
    if (error instanceof Error && error.message.includes("don't have permission")) {
      return NextResponse.json(
        { error: "You don't have permission to delete this organization" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
} 