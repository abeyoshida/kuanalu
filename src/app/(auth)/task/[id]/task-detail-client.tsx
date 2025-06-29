"use client"

import { useParams } from "next/navigation"
import TaskDetail from "@/components/task-detail"

export default function TaskDetailClient() {
  const params = useParams()
  const taskId = params.id as string

  return <TaskDetail _taskId={taskId} />
} 