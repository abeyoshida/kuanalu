import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProjectDetailContent from "@/components/projects/project-detail-content";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { id } = await params;
  const projectId = parseInt(id);
  
  if (isNaN(projectId)) {
    return {
      title: "Project Not Found | FlowBoardAI",
      description: "The project you are looking for does not exist or you do not have access to it.",
    };
  }
  
  try {
    const project = await db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
      .then(results => results[0]);
    
    if (!project) {
      return {
        title: "Project Not Found | FlowBoardAI",
        description: "The project you are looking for does not exist or you do not have access to it.",
      };
    }
    
    return {
      title: `${project.name} | FlowBoardAI`,
      description: `${project.name} project dashboard and management`,
    };
  } catch {
    return {
      title: "Project | FlowBoardAI",
      description: "Project dashboard and management",
    };
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const projectId = parseInt(id);
  
  if (isNaN(projectId)) {
    return notFound();
  }
  
  // Fetch project details
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)
    .then(results => results[0] || null);
  
  if (!project) {
    return notFound();
  }
  
  return (
    <Suspense fallback={<div>Loading project details...</div>}>
      <ProjectDetailContent project={project} />
    </Suspense>
  );
} 