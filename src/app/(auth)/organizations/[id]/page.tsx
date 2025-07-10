import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getOrganizationById } from "@/lib/actions/organization-actions";
import { userHasPermission } from "@/lib/auth/server-permissions";
import { Suspense } from "react";
import OrganizationContent from "@/components/organizations/organization-content";

interface OrganizationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: OrganizationPageProps) {
  const { id } = await params;
  const organizationId = parseInt(id);
  
  if (isNaN(organizationId)) {
    return {
      title: "Organization Not Found | FlowBoardAI",
      description: "The organization you are looking for does not exist or you do not have access to it.",
    };
  }
  
  try {
    const organization = await getOrganizationById(organizationId);
    
    // If no organization is found, return a 404 page
    if (!organization) {
      return {
        title: "Organization Not Found | FlowBoardAI",
        description: "The organization you are looking for does not exist or you do not have access to it.",
      };
    }

    // If we have an organization, use its name in the title
    return {
      title: `${organization.name} | FlowBoardAI`,
      description: `${organization.name} organization dashboard and management`,
    };
  } catch {
    return {
      title: "Organization | FlowBoardAI",
      description: "Organization dashboard and management",
    };
  }
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/organizations");
  }

  const { id } = await params;
  
  if (!id) {
    redirect("/organizations");
  }
  
  const organizationId = parseInt(id);
  
  try {
    // Get organization details
    const organization = await getOrganizationById(organizationId);
    
    // Check permissions for different tabs
    const userId = parseInt(session.user.id);
    const canViewMembers = await userHasPermission(organizationId, 'read', 'organization');
    const canUpdateOrg = await userHasPermission(organizationId, 'update', 'organization');

    return (
      <Suspense fallback={<div>Loading organization details...</div>}>
        <OrganizationContent
          organization={organization}
          userId={userId}
          permissions={{
            canViewMembers,
            canUpdateOrg
          }}
        />
      </Suspense>
    );
  } catch {
    console.error('Organization page error');
    // If the user doesn't have access or organization doesn't exist
    redirect("/organizations");
  }
} 