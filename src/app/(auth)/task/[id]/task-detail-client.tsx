"use client"

import { useParams } from "next/navigation"
import TaskDetail from "@/components/task-detail"

export default function TaskDetailClient() {
  // Get the task ID from the URL params
  const params = useParams();
  
  // Handle different possible formats of params.id
  let taskId: string;
  if (params && params.id) {
    taskId = Array.isArray(params.id) ? params.id[0] : String(params.id);
  } else {
    // Fallback if params.id is undefined
    const pathSegments = window.location.pathname.split('/');
    taskId = pathSegments[pathSegments.length - 1];
  }
  
  return <TaskDetail _taskId={taskId} />
} 