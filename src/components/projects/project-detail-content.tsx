"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import ProjectKanbanBoard from "@/components/project-kanban-board";
import { useHeader } from "@/components/layout/header-context";

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
}

interface ProjectDetailContentProps {
  project: Project;
}

export default function ProjectDetailContent({ project }: ProjectDetailContentProps) {
  const { setEntityName } = useHeader();

  // Set the project name in the header when the component mounts
  useEffect(() => {
    setEntityName(project.name);
    
    // Clean up when unmounting
    return () => setEntityName(null);
  }, [project.name, setEntityName]);
  
  return (
    <div>
      <Tabs defaultValue="board" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="board">
          <ProjectKanbanBoard projectId={project.id} />
        </TabsContent>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">Start Date</div>
                    <div>Jan 15, 2023</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Due Date</div>
                    <div>Dec 31, 2023</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Duration</div>
                    <div>350 days</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">Tasks Completed</div>
                    <div>24 / 36</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Progress</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '66%' }}></div>
                    </div>
                    <div className="text-sm mt-1">66% complete</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-gray-500" />
                  Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">Open Issues</div>
                    <div>3</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Critical Issues</div>
                    <div>1</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Resolved Issues</div>
                    <div>12</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="timeline">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500">Timeline view will be implemented soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 