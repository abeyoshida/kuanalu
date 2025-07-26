"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Building } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog";
import { OrganizationWithMeta } from "@/types/organization";
import { useHeader } from "@/components/layout/header-context";
import { useEffect } from "react";

interface OrganizationsListContentProps {
  organizations: OrganizationWithMeta[];
}

export default function OrganizationsListContent({ organizations }: OrganizationsListContentProps) {
  const { setTitle, setEntityName } = useHeader();

  // Set the header title when component mounts
  useEffect(() => {
    setTitle("Organizations");
    setEntityName(null);
    
    // Clean up when unmounting
    return () => setTitle("Dashboard");
  }, [setTitle, setEntityName]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <CreateOrganizationDialog>
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            New Organization
          </Button>
        </CreateOrganizationDialog>
      </div>
      
      {organizations.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-medium mb-2">No organizations yet</h2>
          <p className="text-gray-500 mb-6">
            Create your first organization to start managing projects and tasks.
          </p>
          <CreateOrganizationDialog>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Organization
            </Button>
          </CreateOrganizationDialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{org.name}</CardTitle>
                <CardDescription>
                  Created {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>{org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}</span>
                </div>
                <div className="mt-2 text-sm">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {org.userRole}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/organizations/${org.id}`} className="w-full">
                  <Button variant="outline" className="w-full">View Organization</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 