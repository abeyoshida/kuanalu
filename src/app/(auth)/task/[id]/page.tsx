import { Suspense } from "react"
import TaskDetail from "@/components/task-detail"

interface TaskDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: TaskDetailPageProps) {
  return {
    title: `Task #${params.id} | Kuanalu`,
    description: "Task details",
  };
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  return (
    <Suspense fallback={<div>Loading task details...</div>}>
      <TaskDetail _taskId={params.id} />
    </Suspense>
  )
} 