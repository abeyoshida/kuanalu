import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getOrganizationById } from "@/lib/actions/organization-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSettings } from "@/components/organizations/organization-settings";
import { OrganizationMembers } from "@/components/organizations/organization-members";
import { OrganizationProjects } from "@/components/organizations/organization-projects";
import { userHasPermission } from "@/lib/auth/server-permissions";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface OrganizationPageProps {
  params: {
    id: string;
  };
  searchParams: {
    tab?: string;
  };
}

export default async function OrganizationPage({ 
  params,
  searchParams
}: OrganizationPageProps) {
  // In Next.js 15, we need to await dynamic parameters
  const { id } = await Promise.resolve(params);
  const { tab = "projects" } = await Promise.resolve(searchParams);
  
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/organizations");
  }
  
  if (!id) {
    redirect("/organizations");
  }
  
  const organizationId = parseInt(id);
  const activeTab = tab;
  
  try {
    // Get organization details
    const organization = await getOrganizationById(organizationId);
    
    // Check permissions for different tabs
    const userId = parseInt(session.user.id);
    const canViewMembers = await userHasPermission(organizationId, 'read', 'organization');
    const canUpdateOrg = await userHasPermission(organizationId, 'update', 'organization');
    
    // Create a compatible organization object for the settings component
    const orgSettings = {
      id: organization.id,
      name: organization.name,
      description: organization.description || undefined
    };
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/organizations" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Organizations
          </Link>
        </div>
        
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            {canViewMembers && <TabsTrigger value="members">Members</TabsTrigger>}
            {canUpdateOrg && <TabsTrigger value="settings">Settings</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="projects" className="space-y-4">
            <OrganizationProjects organizationId={organizationId} />
          </TabsContent>
          
          {canViewMembers && (
            <TabsContent value="members" className="space-y-4">
              <OrganizationMembers organizationId={organizationId} currentUserId={userId} />
            </TabsContent>
          )}
          
          {canUpdateOrg && (
            <TabsContent value="settings" className="space-y-4">
              <OrganizationSettings organization={orgSettings} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error('Organization page error:', error);
    // If the user doesn't have access or organization doesn't exist
    redirect("/organizations");
  }
} 