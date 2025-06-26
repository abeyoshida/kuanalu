import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProjectDetailContent from "@/components/projects/project-detail-content";

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { id } = params;
  const projectId = parseInt(id);
  
  if (isNaN(projectId)) {
    return {
      title: "Project Not Found | Kuanalu",
      description: "The requested project could not be found.",
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
        title: "Project Not Found | Kuanalu",
        description: "The requested project could not be found.",
      };
    }
    
    return {
      title: `${project.name} | Kuanalu`,
      description: `Project details for ${project.name}`,
    };
  } catch {
    return {
      title: "Project | Kuanalu",
      description: "Project details",
    };
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = params;
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
    <Suspense fallback={<div>Loading project details...</div>}>
      <ProjectDetailContent project={project} />
    </Suspense>
  );
} 