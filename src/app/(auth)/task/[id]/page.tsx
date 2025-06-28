import { Suspense } from "react"
import TaskDetail from "@/components/task-detail"
import { getTaskById } from "@/lib/actions/task-actions"

interface TaskDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: TaskDetailPageProps) {
  const { id } = params;
  return {
    title: `Task #${id} | Kuanalu`,
    description: "Task details",
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = params;
  
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Loading task details...</div>}>
      <TaskDetail _taskId={id} />
    </Suspense>
  )
} 