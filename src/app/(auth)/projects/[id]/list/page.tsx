import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getProjectById } from '@/lib/actions/project-actions';
import { getProjectTasks } from '@/lib/actions/task-actions';
import TaskList from '@/components/task-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskFilterOptions, TaskStatus, TaskPriority } from '@/types/task';

interface ListViewPageProps {
  params: {
    id: string;
  };
  searchParams: {
    sort?: string;
    direction?: 'asc' | 'desc';
    status?: string;
    priority?: string;
    assignee?: string;
    search?: string;
  };
}

export default function ListViewPage(props: ListViewPageProps) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <TaskListContent {...props} />
    </Suspense>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function TaskListContent({ params, searchParams }: ListViewPageProps) {
  const projectId = parseInt(params.id);
  
  if (isNaN(projectId)) {
    notFound();
  }
  
  try {
    const project = await getProjectById(projectId);
    
    if (!project) {
      notFound();
    }
    
    // Parse filter options from search params
    const filterOptions: TaskFilterOptions = {
      status: searchParams.status?.split(',') as TaskStatus[] | undefined,
      priority: searchParams.priority?.split(',') as TaskPriority[] | undefined,
      assigneeId: searchParams.assignee?.split(',').map(Number),
      search: searchParams.search,
      includeArchived: false,
      includeCompleted: true,
    };
    
    const tasks = await getProjectTasks(projectId, filterOptions);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{project.name} - Task List</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={tasks} />
          </CardContent>
        </Card>
      </div>
    );
  } catch {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">Error loading tasks</h2>
        <p className="text-gray-600">Please try again later or contact support.</p>
      </div>
    );
  }
}
