import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { 
  getOrganizationById, 
  updateOrganization, 
  deleteOrganization 
} from "@/lib/actions/organization-actions";
import { 
  validateAuthentication, 
  validateNumericParam,
  validateRequestBody,
  handleApiError
} from "@/lib/validation/api-validation";
import { validateOrganizationPermission } from "@/lib/validation/permission-validation";
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
    
    // Validate authentication
    const authError = validateAuthentication(session);
    if (authError) return authError;
    
    // Validate organization ID
    const orgIdResult = validateNumericParam(params.id, "organization ID");
    if (typeof orgIdResult !== 'number') {
      return orgIdResult;
    }
    
    // Validate permission
    const permissionError = await validateOrganizationPermission(session, orgIdResult, 'read');
    if (permissionError) return permissionError;
    
    // Get the organization
    const organization = await getOrganizationById(orgIdResult);
    
    return NextResponse.json(organization);
  } catch (error) {
    return handleApiError(error, "organization");
  }
}

// PUT /api/organizations/[id] - Update organization details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Validate authentication
    const authError = validateAuthentication(session);
    if (authError) return authError;
    
    // Validate organization ID
    const orgIdResult = validateNumericParam(params.id, "organization ID");
    if (typeof orgIdResult !== 'number') {
      return orgIdResult;
    }
    
    // Validate permission
    const permissionError = await validateOrganizationPermission(session, orgIdResult, 'update');
    if (permissionError) return permissionError;
    
    // Validate request body
    const validation = await validateRequestBody(request, updateOrgSchema);
    if ('error' in validation) return validation.error;
    
    // Convert to FormData for compatibility with existing server action
    const formData = new FormData();
    Object.entries(validation.data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    
    // Use the existing server action
    await updateOrganization(orgIdResult, formData);
    
    // Fetch the updated organization
    const updatedOrg = await getOrganizationById(orgIdResult);
    
    return NextResponse.json(updatedOrg);
  } catch (error) {
    return handleApiError(error, "organization");
  }
}

// DELETE /api/organizations/[id] - Delete an organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Validate authentication
    const authError = validateAuthentication(session);
    if (authError) return authError;
    
    // Validate organization ID
    const orgIdResult = validateNumericParam(params.id, "organization ID");
    if (typeof orgIdResult !== 'number') {
      return orgIdResult;
    }
    
    // Validate permission
    const permissionError = await validateOrganizationPermission(session, orgIdResult, 'delete');
    if (permissionError) return permissionError;
    
    // Delete the organization
    await deleteOrganization(orgIdResult);
    
    return NextResponse.json(
      { message: "Organization deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "organization");
  }
} 