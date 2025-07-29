'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { CreateProjectDialog } from "@/components/organizations/create-project-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
}

interface OrganizationProjectsProps {
  organizationId: number;
}

export function OrganizationProjects({ organizationId }: OrganizationProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
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

  const handleDeleteProject = async (projectId: number, projectName: string) => {
    try {
      setDeletingProjectId(projectId);
      setDeleteError(null);
      
      // Add minimum delay so spinner is visible
      const deletePromise = fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      const minDelayPromise = new Promise(resolve => setTimeout(resolve, 800));
      
      const [response] = await Promise.all([deletePromise, minDelayPromise]);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }
      
      // Remove the project from the local state immediately
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      // Emit custom event to refresh sidebar projects
      window.dispatchEvent(new CustomEvent('projectDeleted', { 
        detail: { organizationId, projectId } 
      }));
      
      console.log(`Project "${projectName}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting project:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete project');
    } finally {
      setDeletingProjectId(null);
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
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
              Manage your organization&apos;s projects
            </CardDescription>
          </div>
          <CreateProjectDialog organizationId={organizationId}>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </CreateProjectDialog>
        </CardHeader>
        <CardContent>
          {deleteError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{deleteError}</p>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-red-600 hover:text-red-700"
                onClick={() => setDeleteError(null)}
              >
                Dismiss
              </Button>
            </div>
          )}
          
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-medium mb-2">No projects yet</h2>
              <p className="text-gray-500 mb-6">
                Create your first project to start managing tasks.
              </p>
              <CreateProjectDialog organizationId={organizationId}>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              </CreateProjectDialog>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card 
                  key={project.id} 
                  className={`overflow-hidden relative transition-all duration-200 ${
                    deletingProjectId === project.id 
                      ? 'opacity-50 pointer-events-none' 
                      : 'hover:shadow-md'
                  }`}
                >
                  {/* Loading overlay for deleting project */}
                  {deletingProjectId === project.id && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
                      <div className="flex flex-col items-center gap-3 text-red-600 bg-white rounded-lg p-4 shadow-lg border">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-sm font-medium">Deleting project...</span>
                        </div>
                        <div className="text-xs text-gray-500">This may take a moment</div>
                      </div>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                        {project.description && (
                          <CardDescription className="line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                      
                      {/* Delete button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0 transition-colors duration-200"
                            disabled={deletingProjectId === project.id}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete project</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deleting a project cannot be undone. This will permanently delete this project and remove any data associated with this project from the server.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProject(project.id, project.name)}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                              disabled={deletingProjectId === project.id}
                            >
                              {deletingProjectId === project.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                'Delete Project'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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