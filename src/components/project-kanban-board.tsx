"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import KanbanColumn from "@/components/kanban-column"
import KanbanFilter, { FilterOptions } from "@/components/kanban-filter"
import KanbanSort, { SortOptions } from "@/components/kanban-sort"
import CreateTaskDialog from "@/components/create-task-dialog"
import type { TaskStatus } from "@/types/tasks"
import { getProjectTasks, updateTaskPositions } from "@/lib/actions/task-actions"
import { TaskWithMeta, TaskSortField, SortDirection } from "@/types/task"
import { useMediaQuery } from '@/hooks/use-media-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectKanbanBoardProps {
  projectId: number
}

interface DraggedTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "urgent";
  assignee: string;
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "Todo", color: "bg-gray-100" },
  { id: "today", title: "Today", color: "bg-blue-100" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-100" },
  { id: "in_review", title: "In Review", color: "bg-orange-100" },
  { id: "done", title: "Done", color: "bg-green-100" },
]

export default function ProjectKanbanBoard({ projectId }: ProjectKanbanBoardProps) {
  const [allTasks, setAllTasks] = useState<TaskWithMeta[]>([])
  const [draggedTask, setDraggedTask] = useState<DraggedTask | null>(null)
  const [activeDropColumn, setActiveDropColumn] = useState<TaskStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    priority: [],
    assignee: [],
    hideCompleted: false,
  })
  const [sort, setSort] = useState<SortOptions>({
    field: TaskSortField.PRIORITY,
    direction: SortDirection.DESC,
  })
  const [visibleColumnIndex, setVisibleColumnIndex] = useState(0);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Extract unique assignees from tasks
  const assignees = useMemo(() => {
    const assigneeMap = new Map<string, string>()
    
    allTasks.forEach(task => {
      if (task.assigneeId && task.assigneeName) {
        assigneeMap.set(task.assigneeId.toString(), task.assigneeName)
      }
    })
    
    return Array.from(assigneeMap.entries()).map(([id, name]) => ({
      id,
      name
    }))
  }, [allTasks])

  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      // Filter by search text
      if (filters.search) {
        const searchText = filters.search.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(searchText)
        const matchesDescription = task.description?.toLowerCase().includes(searchText)
        if (!matchesTitle && !matchesDescription) {
          return false
        }
      }

      // Filter by priority
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(task.priority)) {
          return false
        }
      }

      // Filter by assignee
      if (filters.assignee && filters.assignee.length > 0) {
        if (!task.assigneeId || !filters.assignee.includes(task.assigneeId.toString())) {
          return false
        }
      }

      // Filter completed tasks
      if (filters.hideCompleted && task.status === 'done') {
        return false
      }

      return true
    })
  }, [allTasks, filters])

  // Apply sorting to tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let comparison = 0;
      
      switch (sort.field) {
        case TaskSortField.TITLE:
          comparison = a.title.localeCompare(b.title);
          break;
        case TaskSortField.PRIORITY:
          // Map priorities to numeric values for sorting
          const priorityValues = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = (priorityValues[a.priority] || 0) - (priorityValues[b.priority] || 0);
          break;
        case TaskSortField.DUE_DATE:
          // Handle null/undefined due dates
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case TaskSortField.CREATED_AT:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case TaskSortField.UPDATED_AT:
          if (!a.updatedAt && !b.updatedAt) comparison = 0;
          else if (!a.updatedAt) comparison = 1;
          else if (!b.updatedAt) comparison = -1;
          else comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        default:
          comparison = 0;
      }
      
      // Reverse comparison if descending order
      return sort.direction === SortDirection.ASC ? comparison : -comparison;
    });
  }, [filteredTasks, sort]);

  // Add global drag event listeners
  useEffect(() => {
    const handleGlobalDragOver = (e: Event) => {
      e.preventDefault()
    }

    const handleGlobalDrop = (e: Event) => {
      e.preventDefault()
    }

    document.addEventListener('dragover', handleGlobalDragOver)
    document.addEventListener('drop', handleGlobalDrop)

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver)
      document.removeEventListener('drop', handleGlobalDrop)
    }
  }, [])

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  const handleSortChange = (newSort: SortOptions) => {
    setSort(newSort)
  }

  const handleTaskCreated = () => {
    loadTasks()
  }

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Back to original function name since caching issue is resolved
      const tasks = await getProjectTasks(projectId)
      setAllTasks(tasks)
    } catch (error) {
      console.error("Error loading tasks:", error)
      setError("Failed to load tasks. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleDragStart = (task: TaskWithMeta) => {
    const dragTask: DraggedTask = {
      id: task.id.toString(),
      title: task.title,
      description: task.description ?? undefined,
      status: task.status as TaskStatus,
      priority: task.priority,
      assignee: task.assigneeName || "Unassigned",
      assigneeId: task.assigneeId?.toString(),
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : null
    }
    setDraggedTask(dragTask)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setActiveDropColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault()
    setActiveDropColumn(columnId)
  }

  const handleDragLeave = () => {
    setActiveDropColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()
    
    if (!draggedTask) return

    try {
      const taskId = parseInt(draggedTask.id)
      await updateTaskPositions(taskId, newStatus, 0)
      
      // Update the task status locally
      setAllTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus, updatedAt: new Date() }
            : task
        )
      )
    } catch (error) {
      console.error("Error updating task status:", error)
      setError("Failed to update task. Please try again.")
    }

    setDraggedTask(null)
    setActiveDropColumn(null)
  }
  
  // Determine which columns to display based on screen size
  const visibleColumns = useMemo(() => {
    if (isMobile) {
      // On mobile, show only one column at a time
      return [columns[visibleColumnIndex]];
    } else {
      // On desktop, show all columns
      return columns;
    }
  }, [isMobile, visibleColumnIndex]);

  const handlePreviousColumn = () => {
    setVisibleColumnIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextColumn = () => {
    setVisibleColumnIndex(prev => Math.min(columns.length - 1, prev + 1));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex-shrink-0 flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="flex overflow-x-auto pb-4 gap-4 min-h-[500px]">
          {columns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2 mb-2" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <KanbanFilter 
            onFilterChange={handleFilterChange} 
            assignees={assignees}
          />
          <KanbanSort onSortChange={handleSortChange} currentSort={sort} />
        </div>
        <div className="flex-shrink-0 flex justify-end">
          <CreateTaskDialog 
            projectId={projectId} 
            onTaskCreated={handleTaskCreated}
          />
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="relative">
        {isMobile && (
          <div className="flex justify-between items-center mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousColumn}
              disabled={visibleColumnIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {columns[visibleColumnIndex].title} ({visibleColumnIndex + 1}/{columns.length})
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextColumn}
              disabled={visibleColumnIndex === columns.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex overflow-x-auto pb-4 gap-4 min-h-[300px] sm:min-h-[400px] md:min-h-[500px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {visibleColumns.map((column) => {
            const columnTasks = sortedTasks.filter(
              (task) => task.status === column.id
            );
            
            return (
              <KanbanColumn
                key={column.id}
                title={column.title}
                color={column.color}
                tasks={columnTasks}
                projectId={projectId}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isActiveDropTarget={activeDropColumn === column.id}
                draggedTaskId={draggedTask?.id}
                onTaskCreated={handleTaskCreated}
              />
            );
          })}
        </div>
      </div>
    </div>
  )
} 