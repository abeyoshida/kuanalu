"use client"

import { useState } from "react"
import { Search, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { TaskPriority } from "@/types/tasks"

export interface FilterOptions {
  search: string
  priority: TaskPriority[]
  assignee: string[]
  hideCompleted: boolean
}

interface KanbanFilterProps {
  onFilterChange: (filters: FilterOptions) => void
  assignees: { id: string; name: string }[]
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

export default function KanbanFilter({ onFilterChange, assignees }: KanbanFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    priority: [],
    assignee: [],
    hideCompleted: false,
  })
  
  // Count active filters (excluding search)
  const activeFilterCount = 
    filters.priority.length + 
    filters.assignee.length + 
    (filters.hideCompleted ? 1 : 0)
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, search: e.target.value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }
  
  const handlePriorityToggle = (priority: TaskPriority) => {
    let newPriorities: TaskPriority[]
    
    if (filters.priority.includes(priority)) {
      newPriorities = filters.priority.filter(p => p !== priority)
    } else {
      newPriorities = [...filters.priority, priority]
    }
    
    const newFilters = { ...filters, priority: newPriorities }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }
  
  const handleAssigneeToggle = (assigneeId: string) => {
    let newAssignees: string[]
    
    if (filters.assignee.includes(assigneeId)) {
      newAssignees = filters.assignee.filter(a => a !== assigneeId)
    } else {
      newAssignees = [...filters.assignee, assigneeId]
    }
    
    const newFilters = { ...filters, assignee: newAssignees }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }
  
  const handleHideCompletedToggle = (checked: boolean) => {
    const newFilters = { ...filters, hideCompleted: checked }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }
  
  const clearFilters = () => {
    const newFilters = {
      search: "",
      priority: [],
      assignee: [],
      hideCompleted: false,
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }
  
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-2">
      <div className="relative w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search tasks..."
          className="pl-9"
          value={filters.search}
          onChange={handleSearchChange}
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-7 w-7 p-0"
            onClick={() => {
              const newFilters = { ...filters, search: "" }
              setFilters(newFilters)
              onFilterChange(newFilters)
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 rounded-full px-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Priority</h5>
              <div className="grid grid-cols-2 gap-2">
                {priorityOptions.map((priority) => (
                  <div key={priority.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`priority-${priority.value}`} 
                      checked={filters.priority.includes(priority.value)}
                      onCheckedChange={() => handlePriorityToggle(priority.value)}
                    />
                    <Label 
                      htmlFor={`priority-${priority.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {priority.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Assignee</h5>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {assignees.map((assignee) => (
                  <div key={assignee.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`assignee-${assignee.id}`} 
                      checked={filters.assignee.includes(assignee.id)}
                      onCheckedChange={() => handleAssigneeToggle(assignee.id)}
                    />
                    <Label 
                      htmlFor={`assignee-${assignee.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {assignee.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="hide-completed" 
                checked={filters.hideCompleted}
                onCheckedChange={(checked) => 
                  handleHideCompletedToggle(checked as boolean)
                }
              />
              <Label 
                htmlFor="hide-completed"
                className="text-sm cursor-pointer"
              >
                Hide completed tasks
              </Label>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 