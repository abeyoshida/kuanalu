"use client"

import type React from "react"

import TaskCard from "./task-card"
import type { Task } from "@/types/tasks"

interface KanbanColumnProps<T extends Task = Task> {
  title: string
  color: string
  tasks: T[]
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragStart: (task: T) => void
  onDragEnd: () => void
  isActiveDropTarget: boolean
  draggedTaskId?: string
}

export default function KanbanColumn<T extends Task = Task>({ 
  title, 
  color, 
  tasks, 
  onDragOver, 
  onDragLeave,
  onDrop, 
  onDragStart,
  onDragEnd,
  isActiveDropTarget,
  draggedTaskId
}: KanbanColumnProps<T>) {
  return (
    <div className="flex-shrink-0 w-[280px] md:w-[240px] lg:w-[220px] xl:w-[250px] 2xl:w-[280px]">
      <div className={`rounded-lg ${color} px-3 py-1 mb-2`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className="text-sm text-gray-600 bg-white px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
      </div>
      <div 
        className={`min-h-[300px] sm:min-h-[400px] md:min-h-[500px] space-y-3 p-2 rounded-lg transition-colors duration-200 ${
          isActiveDropTarget ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
        }`} 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave} 
        onDrop={onDrop}
      >
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onDragStart={() => onDragStart(task)}
            onDragEnd={onDragEnd}
            isDragging={draggedTaskId === task.id}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 border border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-400">No tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}
