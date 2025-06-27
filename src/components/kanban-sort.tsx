"use client"

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  ArrowDown, 
  ArrowUp 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskSortField, SortDirection } from "@/types/task"

export interface SortOptions {
  field: TaskSortField
  direction: SortDirection
}

interface KanbanSortProps {
  onSortChange: (sort: SortOptions) => void
  currentSort: SortOptions
}

const sortFieldOptions = [
  { value: TaskSortField.TITLE, label: "Title" },
  { value: TaskSortField.PRIORITY, label: "Priority" },
  { value: TaskSortField.DUE_DATE, label: "Due Date" },
  { value: TaskSortField.CREATED_AT, label: "Created Date" },
  { value: TaskSortField.UPDATED_AT, label: "Updated Date" },
]

export default function KanbanSort({ onSortChange, currentSort }: KanbanSortProps) {
  const toggleDirection = () => {
    const newDirection = currentSort.direction === SortDirection.ASC 
      ? SortDirection.DESC 
      : SortDirection.ASC
    
    onSortChange({
      ...currentSort,
      direction: newDirection
    })
  }
  
  const handleSortFieldChange = (value: string) => {
    onSortChange({
      field: value as TaskSortField,
      direction: currentSort.direction
    })
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Sort by:</span>
      <Select 
        value={currentSort.field} 
        onValueChange={handleSortFieldChange}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {sortFieldOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDirection}
        title={currentSort.direction === SortDirection.ASC ? "Ascending" : "Descending"}
      >
        {currentSort.direction === SortDirection.ASC ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
} 