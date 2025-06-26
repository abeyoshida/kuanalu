import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProjectKanbanBoard from "@/components/project-kanban-board";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p>Please sign in to view this project.</p>
      </div>
    );
  }
  
  // Await the params before using them
  const { id } = await params;
  const projectId = parseInt(id);
  
  if (isNaN(projectId)) {
    return notFound();
  }
  
  // Fetch project details
  const project = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)
    .then(results => results[0] || null);
  
  if (!project) {
    return notFound();
  }
  
  return (
    <>
      {project.description && (
        <div className="mb-6">
          <p className="text-gray-600">{project.description}</p>
        </div>
      )}
      
      <ProjectKanbanBoard projectId={projectId} />
    </>
  );
} 