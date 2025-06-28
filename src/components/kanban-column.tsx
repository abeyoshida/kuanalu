"use client"

import type React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import TaskCard from "./task-card"
import CreateTaskDialog from "./create-task-dialog"
import type { Task } from "@/types/tasks"
import type { TaskStatus } from "@/types/tasks"

interface KanbanColumnProps<T extends Task = Task> {
  title: string
  color: string
  tasks: T[]
  projectId: number
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragStart: (task: T) => void
  onDragEnd: () => void
  isActiveDropTarget: boolean
  draggedTaskId?: string
  onTaskCreated?: () => void
}

export default function KanbanColumn<T extends Task = Task>({ 
  title, 
  color, 
  tasks, 
  projectId,
  onDragOver, 
  onDragLeave,
  onDrop, 
  onDragStart,
  onDragEnd,
  isActiveDropTarget,
  draggedTaskId,
  onTaskCreated
}: KanbanColumnProps<T>) {
  // Extract status from title
  const getStatusFromTitle = (): TaskStatus => {
    const statusMap: Record<string, TaskStatus> = {
      "Backlog": "backlog",
      "Todo": "todo",
      "In Progress": "in_progress",
      "In Review": "in_review",
      "Done": "done"
    };
    return statusMap[title] || "todo";
  };

  return (
    <div className="flex-shrink-0 w-[280px] md:w-[240px] lg:w-[220px] xl:w-[250px] 2xl:w-[280px]">
      <div className={`rounded-lg ${color} px-3 py-1 mb-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-800">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 bg-white/90 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
            <CreateTaskDialog 
              projectId={projectId}
              defaultStatus={getStatusFromTitle()}
              onTaskCreated={onTaskCreated}
            >
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add task</span>
              </Button>
            </CreateTaskDialog>
          </div>
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
