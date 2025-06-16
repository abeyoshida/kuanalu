'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FolderKanban } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CreateProjectDialog } from "@/components/organizations/create-project-dialog";

interface OrganizationProjectsProps {
  organizationId: number;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
}

export function OrganizationProjects({ organizationId }: OrganizationProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Fetch projects for the organization
        const response = await fetch(`/api/organizations/${organizationId}/projects`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }
        
        const data = await response.json();
        setProjects(data.projects);
      } catch (error) {
        setError("Failed to load projects");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [organizationId]);
  
  if (loading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }
  
  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Manage your organization's projects
            </CardDescription>
          </div>
          <CreateProjectDialog organizationId={organizationId}>
            <Button size="sm" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New Project
            </Button>
          </CreateProjectDialog>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-medium mb-2">No projects yet</h2>
              <p className="text-gray-500 mb-6">
                Create your first project to start managing tasks.
              </p>
              <CreateProjectDialog organizationId={organizationId}>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create Project
                </Button>
              </CreateProjectDialog>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription>
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="outline" className="w-full">View Project</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 