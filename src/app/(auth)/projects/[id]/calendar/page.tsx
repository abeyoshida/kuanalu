import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ProjectDetailContent from '@/components/projects/project-detail-content';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectCalendarPageProps {
  params: {
    id: string;
  };
}

async function getProject(id: number) {
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project.length) {
    return null;
  }

  return project[0];
}

export default async function ProjectCalendarPage({ params }: ProjectCalendarPageProps) {
  const projectId = parseInt(params.id);

  if (isNaN(projectId)) {
    notFound();
  }

  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <ProjectDetailContent project={project} initialTab="calendar" />
      </Suspense>
    </div>
  );
} 