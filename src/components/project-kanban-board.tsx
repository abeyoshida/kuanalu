"use client"

import { useState, useEffect, useMemo } from "react"
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

// Map database task to UI task
const mapDbTaskToUiTask = (dbTask: TaskWithMeta) => {
  return {
    id: dbTask.id.toString(),
    title: dbTask.title,
    description: dbTask.description || undefined,
    status: dbTask.status as TaskStatus,
    priority: dbTask.priority,
    assignee: dbTask.assigneeName || "Unassigned",
    assigneeId: dbTask.assigneeId ? dbTask.assigneeId.toString() : undefined,
    createdAt: dbTask.createdAt,
    updatedAt: dbTask.updatedAt,
    dueDate: dbTask.dueDate
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
  const [allTasks, setAllTasks] = useState<ReturnType<typeof mapDbTaskToUiTask>[]>([])
  const [draggedTask, setDraggedTask] = useState<ReturnType<typeof mapDbTaskToUiTask> | null>(null)
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

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const projectTasks = await getProjectTasks(projectId)
        
        if (projectTasks && Array.isArray(projectTasks)) {
          setAllTasks(projectTasks.map(mapDbTaskToUiTask))
          setError(null)
        } else {
          console.error("Invalid project tasks data:", projectTasks)
          setAllTasks([])
          setError("Failed to load tasks. Invalid data received.")
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err)
        setError("Failed to load tasks. Please try again.")
        setAllTasks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [projectId])

  // Extract unique assignees from tasks
  const assignees = useMemo(() => {
    const assigneeMap = new Map<string, string>()
    
    allTasks.forEach(task => {
      if (task.assigneeId && task.assignee) {
        assigneeMap.set(task.assigneeId, task.assignee)
      }
    })
    
    return Array.from(assigneeMap.entries()).map(([id, name]) => ({ id, name }))
  }, [allTasks])

  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      // Filter by search text
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      
      // Filter by priority
      if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
        return false
      }
      
      // Filter by assignee
      if (filters.assignee.length > 0 && (!task.assigneeId || !filters.assignee.includes(task.assigneeId))) {
        return false
      }
      
      // Filter completed tasks
      if (filters.hideCompleted && task.status === "done") {
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
    // Reset drag state if the user drops outside a valid drop target
    const handleGlobalDragEnd = () => {
      setDraggedTask(null)
      setActiveDropColumn(null)
    }

    document.addEventListener('dragend', handleGlobalDragEnd)
    
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd)
    }
  }, [])

  const handleDragStart = (task: ReturnType<typeof mapDbTaskToUiTask>) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault()
    setActiveDropColumn(columnId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear the active column if we're not entering a child element
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return
    }
    setActiveDropColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()
    setActiveDropColumn(null)

    if (!draggedTask) return

    // Don't do anything if the status hasn't changed
    if (draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    // Optimistically update the UI
    const updatedTasks = allTasks.map((task) => 
      task.id === draggedTask.id ? { ...task, status: newStatus } : task
    )
    setAllTasks(updatedTasks)

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
      if (projectTasks && Array.isArray(projectTasks)) {
        setAllTasks(projectTasks.map(mapDbTaskToUiTask))
      } else {
        setAllTasks([])
      }
    } finally {
      setDraggedTask(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setActiveDropColumn(null)
  }

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  const handleSortChange = (newSort: SortOptions) => {
    setSort(newSort)
  }

  const handleTaskCreated = async () => {
    try {
      setIsLoading(true)
      const projectTasks = await getProjectTasks(projectId)
      if (projectTasks && Array.isArray(projectTasks)) {
        setAllTasks(projectTasks.map(mapDbTaskToUiTask))
        setError(null)
      }
    } catch (err) {
      console.error("Failed to refresh tasks:", err)
      setError("Failed to refresh tasks. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle column navigation for mobile view
  const handlePreviousColumn = () => {
    setVisibleColumnIndex(prev => Math.max(0, prev - 1));
  };
  
  const handleNextColumn = () => {
    setVisibleColumnIndex(prev => Math.min(columns.length - 1, prev + 1));
  };
  
  // Determine which columns to display based on screen size
  const visibleColumns = useMemo(() => {
    if (isMobile) {
      // On mobile, show only one column at a time
      return [columns[visibleColumnIndex]];
    }
    // On desktop, show all columns
    return columns;
  }, [isMobile, visibleColumnIndex]);

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
              if (projectTasks && Array.isArray(projectTasks)) {
                setAllTasks(projectTasks.map(mapDbTaskToUiTask))
                setError(null)
              } else {
                console.error("Invalid project tasks data:", projectTasks)
                setAllTasks([])
                setError("Failed to load tasks. Invalid data received.")
              }
            } catch (err) {
              console.error("Failed to fetch tasks:", err)
              setError("Failed to load tasks. Please try again.")
              setAllTasks([])
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
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
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
      )}
    </div>
  )
} 