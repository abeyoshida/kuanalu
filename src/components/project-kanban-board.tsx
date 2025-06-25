"use client"

import { useState, useEffect } from "react"
import KanbanColumn from "@/components/kanban-column"
import type { TaskStatus } from "@/types/tasks"
import { getProjectTasks, updateTaskPositions } from "@/lib/actions/task-actions"
import { TaskWithMeta } from "@/types/task"

interface ProjectKanbanBoardProps {
  projectId: number
}

// Map database task to UI task
const mapDbTaskToUiTask = (dbTask: TaskWithMeta) => {
  return {
    id: dbTask.id.toString(),
    title: dbTask.title,
    description: dbTask.description || undefined,
    status: dbTask.status as TaskStatus,
    priority: dbTask.priority,
    assignee: dbTask.assigneeName || "Unassigned",
    createdAt: dbTask.createdAt,
  }
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-gray-100" },
  { id: "todo", title: "Todo", color: "bg-blue-100" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-100" },
  { id: "in_review", title: "In Review", color: "bg-orange-100" },
  { id: "done", title: "Done", color: "bg-green-100" },
]

export default function ProjectKanbanBoard({ projectId }: ProjectKanbanBoardProps) {
  const [tasks, setTasks] = useState<ReturnType<typeof mapDbTaskToUiTask>[]>([])
  const [draggedTask, setDraggedTask] = useState<ReturnType<typeof mapDbTaskToUiTask> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const projectTasks = await getProjectTasks(projectId)
        setTasks(projectTasks.map(mapDbTaskToUiTask))
        setError(null)
      } catch (err) {
        console.error("Failed to fetch tasks:", err)
        setError("Failed to load tasks. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [projectId])

  const handleDragStart = (task: ReturnType<typeof mapDbTaskToUiTask>) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()

    if (!draggedTask) return

    // Optimistically update the UI
    const updatedTasks = tasks.map((task) => 
      task.id === draggedTask.id ? { ...task, status: newStatus } : task
    )
    setTasks(updatedTasks)

    try {
      // Calculate new position (at the end of the column)
      const tasksInTargetColumn = updatedTasks.filter(t => t.status === newStatus)
      const newPosition = tasksInTargetColumn.length

      // Update the task status and position in the database
      await updateTaskPositions(
        parseInt(draggedTask.id),
        newStatus,
        newPosition
      )
    } catch (err) {
      console.error("Failed to update task status:", err)
      // Revert the UI changes on error
      setError("Failed to update task status. Please try again.")
      // Fetch the tasks again to ensure UI is in sync with the database
      const projectTasks = await getProjectTasks(projectId)
      setTasks(projectTasks.map(mapDbTaskToUiTask))
    } finally {
      setDraggedTask(null)
    }
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status)
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading tasks...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
        <p>{error}</p>
        <button 
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          onClick={async () => {
            try {
              setIsLoading(true)
              const projectTasks = await getProjectTasks(projectId)
              setTasks(projectTasks.map(mapDbTaskToUiTask))
              setError(null)
            } catch (err) {
              console.error("Failed to fetch tasks:", err)
              setError("Failed to load tasks. Please try again.")
            } finally {
              setIsLoading(false)
            }
          }}
        >
          Try again
        </button>
      </div>
    )
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