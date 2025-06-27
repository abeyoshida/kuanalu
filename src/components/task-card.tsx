"use client"

import type { Task } from "@/types/tasks"
import { Calendar, User, AlertCircle, Clock, CheckCircle } from "lucide-react"

interface TaskCardProps {
  task: Task
  onDragStart: () => void
  onDragEnd: () => void
  isDragging?: boolean
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
  urgent: "bg-purple-100 text-purple-800",
}

const statusIcons = {
  backlog: <Clock className="w-3 h-3 text-gray-500" />,
  todo: <AlertCircle className="w-3 h-3 text-blue-500" />,
  in_progress: <Clock className="w-3 h-3 text-yellow-500" />,
  in_review: <AlertCircle className="w-3 h-3 text-orange-500" />,
  done: <CheckCircle className="w-3 h-3 text-green-500" />,
}

export default function TaskCard({ task, onDragStart, onDragEnd, isDragging = false }: TaskCardProps) {
  // Format the date safely
  const formatDate = (date: Date | string) => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return date;
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-lg border p-4 shadow-sm transition-all cursor-move ${
        isDragging 
          ? 'opacity-50 border-blue-400 shadow-md scale-105' 
          : 'border-gray-200 hover:shadow-md'
      }`}
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
          <span>{formatDate(task.createdAt)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-2 text-xs">
        {statusIcons[task.status as keyof typeof statusIcons]}
        <span className="capitalize">{task.status.replace('_', ' ')}</span>
      </div>
    </div>
  )
}
