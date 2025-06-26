"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Calendar, Clock, AlertCircle } from "lucide-react";
import ProjectKanbanBoard from "@/components/project-kanban-board";

// Status badge colors
const statusColors: Record<string, string> = {
  planning: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  completed: "bg-purple-100 text-purple-800",
  canceled: "bg-gray-100 text-gray-800",
};

interface ProjectDetailContentProps {
  project: {
    id: number;
    name: string;
    description: string | null;
    status: string;
  };
}

export default function ProjectDetailContent({ project }: ProjectDetailContentProps) {
  const formattedStatus = project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge className={statusColors[project.status] || "bg-gray-100"}>
              {formattedStatus}
            </Badge>
          </div>
          {project.description && (
            <p className="text-gray-600 mt-2">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage Team
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
      
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