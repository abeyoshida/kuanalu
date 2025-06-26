"use client"

import type React from "react"

import TaskCard from "./task-card"
import type { Task } from "@/types/tasks"

interface KanbanColumnProps<T extends Task = Task> {
  title: string
  color: string
  tasks: T[]
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragStart: (task: T) => void
}

export default function KanbanColumn<T extends Task = Task>({ 
  title, 
  color, 
  tasks, 
  onDragOver, 
  onDrop, 
  onDragStart 
}: KanbanColumnProps<T>) {
  return (
    <div className="flex-shrink-0 w-80">
      <div className={`rounded-lg ${color} px-3 py-1 mb-2`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className="text-sm text-gray-600 bg-white px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
      </div>
      <div className="min-h-[500px] space-y-3" onDragOver={onDragOver} onDrop={onDrop}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onDragStart={() => onDragStart(task)} />
        ))}
      </div>
    </div>
  )
}
