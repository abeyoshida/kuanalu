"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar, Users } from "lucide-react";
import Link from "next/link";

// Sample project data - in a real app, this would come from props
const sampleProjects = [
  {
    id: 1,
    name: "Website Redesign",
    description: "Redesign the company website with a modern look and feel",
    status: "active",
    dueDate: "2023-12-15",
    members: 5
  },
  {
    id: 2,
    name: "Mobile App Development",
    description: "Develop a mobile app for iOS and Android",
    status: "planning",
    dueDate: "2024-01-30",
    members: 3
  },
  {
    id: 3,
    name: "Marketing Campaign",
    description: "Plan and execute a marketing campaign for the new product",
    status: "completed",
    dueDate: "2023-11-01",
    members: 4
  }
];

// Status badge colors
const statusColors: Record<string, string> = {
  planning: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  completed: "bg-purple-100 text-purple-800",
  canceled: "bg-gray-100 text-gray-800"
};

export default function ProjectContent() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          New Project
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleProjects.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{project.name}</CardTitle>
                <Badge className={statusColors[project.status]}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{project.members} members</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/projects/${project.id}`} className="w-full">
                <Button variant="outline" className="w-full">View Project</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {sampleProjects.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">No projects yet</h2>
          <p className="text-gray-500 mb-6">
            Create your first project to start managing tasks.
          </p>
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Project
          </Button>
        </div>
      )}
    </div>
  );
} 