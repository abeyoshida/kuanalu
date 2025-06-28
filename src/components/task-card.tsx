"use client"

import type { Task } from "@/types/tasks"
import { Calendar, User, AlertCircle, Clock, CheckCircle, Pencil } from "lucide-react"
import Link from "next/link"

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
      className={`bg-white rounded-lg border p-3 shadow-sm transition-all cursor-move ${
        isDragging 
          ? 'opacity-50 border-blue-400 shadow-md scale-105' 
          : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-1.5 sm:mb-2">
        <h4 className="font-medium text-gray-900 text-xs sm:text-sm leading-5 mr-2">{task.title}</h4>
        <Link href={`/task/${task.id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </Link>
      </div>

      {task.description && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>}

      <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 gap-y-1">
        <div className="flex items-center gap-1 min-w-[80px]">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[80px]">{task.assignee}</span>
        </div>
        <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1.5 text-xs">
        <div className="flex items-center gap-1">
          {statusIcons[task.status as keyof typeof statusIcons]}
          <span className="capitalize">{task.status.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(task.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
