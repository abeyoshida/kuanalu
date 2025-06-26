import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const session = await auth();
  
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{project.name}</h1>
      </div>
      {children}
    </>
  );
} 