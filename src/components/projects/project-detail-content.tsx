"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, AlertCircle, List, CalendarDays } from "lucide-react";
import ProjectKanbanBoard from "@/components/project-kanban-board";
import { useHeader } from "@/components/layout/header-context";
import TaskList from "@/components/task-list";
import { 
  TaskSortOption, 
  TaskSortField, 
  SortDirection, 
  TaskWithMeta,
  PaginatedTasksResult,
  TaskFilterOptions
} from "@/types/task";
import { Skeleton } from "@/components/ui/skeleton";
import SimpleSearch from "@/components/simple-search";
import CalendarView from "@/components/calendar-view";
import { Project } from '@/types/project';

interface ProjectDetailContentProps {
  project: Project;
  initialTab?: string;
}

export default function ProjectDetailContent({ project, initialTab = "board" }: ProjectDetailContentProps) {
  const { setEntityName } = useHeader();
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Set the project name in the header when the component mounts
  useEffect(() => {
    setEntityName(project.name);
    
    // Clean up when unmounting
    return () => setEntityName(null);
  }, [project.name, setEntityName]);

  // Load tasks with optional page size override
  const loadTasks = useCallback(async (page = currentPage, pageSizeOverride?: number) => {
    try {
      setIsLoading(true);
      const filters: TaskFilterOptions = {
        page,
        pageSize: pageSizeOverride || pageSize
      };
      
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      // Call the API with pagination parameters and sorting
      const response = await fetch(`/api/projects/${project.id}/tasks?` + new URLSearchParams({
        page: page.toString(),
        pageSize: (pageSizeOverride || pageSize).toString(),
        sort: TaskSortField.PRIORITY,
        direction: SortDirection.DESC,
        ...(searchTerm ? { search: searchTerm } : {})
      }));
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data: PaginatedTasksResult = await response.json();
      
      setTasks(data.tasks);
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
      setPageSize(data.pagination.pageSize);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, project.id, searchTerm]);

  // Load tasks when component mounts or initialTab changes
  useEffect(() => {
    if (activeTab === "list" || activeTab === "calendar") {
      const pageSizeOverride = activeTab === "calendar" ? 100 : undefined;
      loadTasks(1, pageSizeOverride);
    }
  }, [initialTab, activeTab, loadTasks]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Reset pagination when switching to list view
    if (value === "list") {
      setCurrentPage(1);
      loadTasks();
    }
    
    // Load tasks for calendar view
    if (value === "calendar") {
      loadTasks(1, 100); // Load more tasks for calendar view
    }
  };
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
    
    // Only fetch if we're on the list tab
    if (activeTab === "list") {
      loadTasks(1);
    }
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadTasks(page);
  };
  
  // Handle sort
  const handleSort = (sortOption: TaskSortOption) => {
    // Sort client-side
    const sortedTasks = [...tasks].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortOption.field) {
        case TaskSortField.TITLE:
          valueA = a.title?.toLowerCase() || '';
          valueB = b.title?.toLowerCase() || '';
          break;
        case TaskSortField.STATUS:
          valueA = a.status || '';
          valueB = b.status || '';
          break;
        case TaskSortField.PRIORITY:
          const priorityMap: Record<string, number> = {
            urgent: 4, high: 3, medium: 2, low: 1
          };
          valueA = priorityMap[a.priority || 'medium'] || 0;
          valueB = priorityMap[b.priority || 'medium'] || 0;
          break;
        case TaskSortField.DUE_DATE:
          valueA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          valueB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          break;
        default:
          return 0;
      }
      
      const compareResult = typeof valueA === 'string'
        ? valueA.localeCompare(valueB as string)
        : (valueA as number) - (valueB as number);
      
      return sortOption.direction === SortDirection.ASC ? compareResult : -compareResult;
    });
    
    setTasks(sortedTasks);
  };
  
  return (
    <div className="w-full overflow-x-hidden">
      <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
        <TabsList className="mb-6 flex flex-wrap justify-start !justify-start">
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="board" className="w-full overflow-x-auto">
          <ProjectKanbanBoard projectId={project.id} />
        </TabsContent>
        
        <TabsContent value="list">
          <div className="space-y-4">
            <SimpleSearch onSearch={handleSearch} />
            
            <Card>
              <CardHeader className="sm:flex-row sm:items-center">
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5 text-gray-500" />
                  Task List
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <TaskList 
                    tasks={tasks} 
                    onSortChange={handleSort}
                    pagination={{
                      currentPage,
                      totalPages,
                      totalItems,
                      pageSize
                    }}
                    onPageChange={handlePageChange}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="calendar">
          <Card>
            <CardHeader className="sm:flex-row sm:items-center">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-gray-500" />
                Task Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] md:h-[600px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-[300px] md:h-[500px] w-full" />
                  </div>
                </div>
              ) : (
                <CalendarView tasks={tasks} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">Start Date</div>
                    <div>Jan 15, 2023</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Due Date</div>
                    <div>Dec 31, 2023</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Duration</div>
                    <div>350 days</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">Tasks Completed</div>
                    <div>24 / 36</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Progress</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '66%' }}></div>
                    </div>
                    <div className="text-sm mt-1">66% complete</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-gray-500" />
                  Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">Open Issues</div>
                    <div>3</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Critical Issues</div>
                    <div>1</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Resolved Issues</div>
                    <div>12</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="timeline">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500">Timeline view will be implemented soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
