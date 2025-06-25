"use client"

import type React from "react"

import { useState } from "react"
import KanbanColumn from "@/components/kanban-column"
import type { Task, TaskStatus } from "@/types/tasks"

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Design user authentication flow",
    description: "Create wireframes and mockups for login and signup pages",
    status: "backlog",
    priority: "high",
    assignee: "John Doe",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Implement API endpoints",
    description: "Build REST API for user management and task operations",
    status: "todo",
    priority: "medium",
    assignee: "Jane Smith",
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "3",
    title: "Set up database schema",
    description: "Design and implement PostgreSQL database structure",
    status: "in_progress",
    priority: "high",
    assignee: "Mike Johnson",
    createdAt: new Date("2024-01-17"),
  },
  {
    id: "4",
    title: "Create responsive dashboard",
    description: "Build main dashboard with charts and analytics",
    status: "in_progress",
    priority: "medium",
    assignee: "Sarah Wilson",
    createdAt: new Date("2024-01-18"),
  },
  {
    id: "5",
    title: "Implement drag and drop",
    description: "Add drag and drop functionality to kanban board",
    status: "in_review",
    priority: "high",
    assignee: "John Doe",
    createdAt: new Date("2024-01-19"),
  },
  {
    id: "6",
    title: "Write unit tests",
    description: "Create comprehensive test suite for core functionality",
    status: "in_review",
    priority: "medium",
    assignee: "Jane Smith",
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "7",
    title: "Fix authentication bug",
    description: "Resolve issue with token expiration handling",
    status: "todo",
    priority: "high",
    assignee: "Mike Johnson",
    createdAt: new Date("2024-01-21"),
  },
  {
    id: "8",
    title: "Setup CI/CD pipeline",
    description: "Configure automated testing and deployment",
    status: "done",
    priority: "medium",
    assignee: "Sarah Wilson",
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "9",
    title: "User research interviews",
    description: "Conduct interviews with 10 potential users",
    status: "done",
    priority: "low",
    assignee: "John Doe",
    createdAt: new Date("2024-01-12"),
  },
]

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-gray-100" },
  { id: "todo", title: "Todo", color: "bg-blue-100" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-100" },
  { id: "in_review", title: "In Review", color: "bg-orange-100" },
  { id: "done", title: "Done", color: "bg-green-100" },
]

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()

    if (draggedTask) {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === draggedTask.id ? { ...task, status: newStatus } : task)),
      )
      setDraggedTask(null)
    }
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status)
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-6">
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          title={column.title}
          color={column.color}
          tasks={getTasksByStatus(column.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
          onDragStart={handleDragStart}
        />
      ))}
    </div>
  )
}
