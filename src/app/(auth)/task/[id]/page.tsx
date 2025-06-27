import { Suspense } from "react"
import TaskDetail from "@/components/task-detail"

interface TaskDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: TaskDetailPageProps) {
  const { id } = await params;
  return {
    title: `Task #${id} | Kuanalu`,
    description: "Task details",
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div>Loading task details...</div>}>
      <TaskDetail _taskId={id} />
    </Suspense>
  )
} 