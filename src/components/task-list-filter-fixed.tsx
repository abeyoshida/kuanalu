'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  TaskFilterOptions,
  TaskSortField,
  SortDirection,
  TaskStatus,
  TaskPriority
} from '@/types/task';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface TaskListFilterProps {
  onFilterChange?: (filters: TaskFilterOptions) => void;
}

export default function TaskListFilter({ onFilterChange }: TaskListFilterProps) {
  const initialRenderRef = useRef(true);
  
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus[]>([]);
  const [priority, setPriority] = useState<TaskPriority[]>([]);
  const [sortField, setSortField] = useState<TaskSortField>(TaskSortField.PRIORITY);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.DESC);
  const [includeCompleted, setIncludeCompleted] = useState(true);

  // Call onFilterChange on initial render
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        status,
        priority,
        search,
        includeCompleted,
        includeArchived: false,
      });
    }
    // This effect should only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update parent when filters change
  useEffect(() => {
    // Skip the first render to avoid infinite loops
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    
    // Notify parent component of filter changes
    if (onFilterChange) {
      onFilterChange({
        status,
        priority,
        search,
        includeCompleted,
        includeArchived: false,
      });
    }
  }, [search, status, priority, sortField, sortDirection, includeCompleted, onFilterChange]);

  const clearFilters = () => {
    setSearch('');
    setStatus([]);
    setPriority([]);
    setSortField(TaskSortField.PRIORITY);
    setSortDirection(SortDirection.DESC);
    setIncludeCompleted(true);
  };

  const toggleStatus = (value: TaskStatus) => {
    setStatus(prev => 
      prev.includes(value) 
        ? prev.filter(s => s !== value) 
        : [...prev, value]
    );
  };

  const togglePriority = (value: TaskPriority) => {
    setPriority(prev => 
      prev.includes(value) 
        ? prev.filter(p => p !== value) 
        : [...prev, value]
    );
  };

  const activeFiltersCount = [
    search ? 1 : 0,
    status.length > 0 ? 1 : 0,
    priority.length > 0 ? 1 : 0,
    !includeCompleted ? 1 : 0
  ].reduce((sum, val) => sum + val, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-10"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Select
          value={sortField}
          onValueChange={(value) => setSortField(value as TaskSortField)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TaskSortField.TITLE}>Title</SelectItem>
            <SelectItem value={TaskSortField.STATUS}>Status</SelectItem>
            <SelectItem value={TaskSortField.PRIORITY}>Priority</SelectItem>
            <SelectItem value={TaskSortField.DUE_DATE}>Due Date</SelectItem>
            <SelectItem value={TaskSortField.CREATED_AT}>Created</SelectItem>
            <SelectItem value={TaskSortField.UPDATED_AT}>Updated</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={sortDirection}
          onValueChange={(value) => setSortDirection(value as SortDirection)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SortDirection.ASC}>Ascending</SelectItem>
            <SelectItem value={SortDirection.DESC}>Descending</SelectItem>
          </SelectContent>
        </Select>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="status-backlog" 
                      checked={status.includes('backlog' as TaskStatus)}
                      onCheckedChange={() => toggleStatus('backlog' as TaskStatus)}
                    />
                    <Label htmlFor="status-backlog">Backlog</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="status-todo" 
                      checked={status.includes('todo' as TaskStatus)}
                      onCheckedChange={() => toggleStatus('todo' as TaskStatus)}
                    />
                    <Label htmlFor="status-todo">To Do</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="status-in_progress" 
                      checked={status.includes('in_progress' as TaskStatus)}
                      onCheckedChange={() => toggleStatus('in_progress' as TaskStatus)}
                    />
                    <Label htmlFor="status-in_progress">In Progress</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="status-in_review" 
                      checked={status.includes('in_review' as TaskStatus)}
                      onCheckedChange={() => toggleStatus('in_review' as TaskStatus)}
                    />
                    <Label htmlFor="status-in_review">In Review</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="status-done" 
                      checked={status.includes('done' as TaskStatus)}
                      onCheckedChange={() => toggleStatus('done' as TaskStatus)}
                    />
                    <Label htmlFor="status-done">Done</Label>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Priority</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="priority-urgent" 
                      checked={priority.includes('urgent' as TaskPriority)}
                      onCheckedChange={() => togglePriority('urgent' as TaskPriority)}
                    />
                    <Label htmlFor="priority-urgent">Urgent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="priority-high" 
                      checked={priority.includes('high' as TaskPriority)}
                      onCheckedChange={() => togglePriority('high' as TaskPriority)}
                    />
                    <Label htmlFor="priority-high">High</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="priority-medium" 
                      checked={priority.includes('medium' as TaskPriority)}
                      onCheckedChange={() => togglePriority('medium' as TaskPriority)}
                    />
                    <Label htmlFor="priority-medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="priority-low" 
                      checked={priority.includes('low' as TaskPriority)}
                      onCheckedChange={() => togglePriority('low' as TaskPriority)}
                    />
                    <Label htmlFor="priority-low">Low</Label>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Options</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-completed" 
                    checked={includeCompleted}
                    onCheckedChange={(checked) => setIncludeCompleted(!!checked)}
                  />
                  <Label htmlFor="include-completed">Include completed tasks</Label>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={clearFilters}
              >
                Clear all filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
