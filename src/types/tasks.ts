export type TaskStatus = "todo" | "today" | "doing" | "blocked" | "done"

export type TaskPriority = "low" | "medium" | "high" | "urgent"

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee: string
  createdAt: Date
}
