import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getOrganizationById } from "@/lib/actions/organization-actions";
import { userHasPermission } from "@/lib/auth/server-permissions";
import { Suspense } from "react";
import OrganizationContent from "@/components/organizations/organization-content";

interface OrganizationPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: OrganizationPageProps) {
  const { id } = params;
  const organizationId = parseInt(id);
  
  if (isNaN(organizationId)) {
    return {
      title: "Organization Not Found | Kuanalu",
      description: "The requested organization could not be found.",
    };
  }
  
  try {
    const organization = await getOrganizationById(organizationId);
    
    return {
      title: `${organization.name} | Kuanalu`,
      description: organization.description || `Organization details for ${organization.name}`,
    };
  } catch (error) {
    return {
      title: "Organization | Kuanalu",
      description: "Organization details",
    };
  }
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/organizations");
  }
  
  const { id } = params;
  
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
  } catch (error) {
    console.error('Organization page error:', error);
    // If the user doesn't have access or organization doesn't exist
    redirect("/organizations");
  }
} 