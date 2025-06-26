"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSettings } from "@/components/organizations/organization-settings";
import { OrganizationMembers } from "@/components/organizations/organization-members";
import { OrganizationProjects } from "@/components/organizations/organization-projects";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface OrganizationContentProps {
  organization: {
    id: number;
    name: string;
    description: string | null;
  };
  userId: number;
  permissions: {
    canViewMembers: boolean;
    canUpdateOrg: boolean;
  };
}

export default function OrganizationContent({
  organization,
  userId,
  permissions
}: OrganizationContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("projects");
  
  // Get the tab from URL or default to "projects"
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["projects", "members", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/organizations/${organization.id}?tab=${value}`, { scroll: false });
  };
  
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
        
        <h1 className="text-3xl font-bold">{organization.name}</h1>
        {organization.description && (
          <p className="text-gray-600 mt-2">{organization.description}</p>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          {permissions.canViewMembers && <TabsTrigger value="members">Members</TabsTrigger>}
          {permissions.canUpdateOrg && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="projects" className="space-y-4">
          <OrganizationProjects organizationId={organization.id} />
        </TabsContent>
        
        {permissions.canViewMembers && (
          <TabsContent value="members" className="space-y-4">
            <OrganizationMembers organizationId={organization.id} currentUserId={userId} />
          </TabsContent>
        )}
        
        {permissions.canUpdateOrg && (
          <TabsContent value="settings" className="space-y-4">
            <OrganizationSettings organization={orgSettings} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 