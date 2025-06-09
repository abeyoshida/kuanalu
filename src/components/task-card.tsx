"use client"

import type { Task } from "@/types/task"
import { Calendar, User, AlertCircle } from "lucide-react"

interface TaskCardProps {
  task: Task
  onDragStart: () => void
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
}

export default function TaskCard({ task, onDragStart }: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-move"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm leading-5">{task.title}</h4>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {task.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>{task.assignee}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{task.createdAt.toLocaleDateString()}</span>
        </div>
      </div>

      {task.status === "blocked" && (
        <div className="flex items-center gap-1 mt-2 text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span className="text-xs">Blocked</span>
        </div>
      )}
    </div>
  )
}
