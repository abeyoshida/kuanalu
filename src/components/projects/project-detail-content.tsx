"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, AlertCircle, List, Search, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Simple Search Component that doesn't use URL parameters
function SimpleSearch({ onSearch }: { onSearch: (term: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleSearch = () => {
    onSearch(searchTerm);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-10"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button onClick={handleSearch}>Search</Button>
    </div>
  );
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
}

interface ProjectDetailContentProps {
  project: Project;
}

export default function ProjectDetailContent({ project }: ProjectDetailContentProps) {
  const { setEntityName } = useHeader();
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("board");
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
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Reset pagination when switching to list view
    if (value === "list") {
      setCurrentPage(1);
      loadTasks();
    }
  };
  
  // Load tasks
  const loadTasks = async (page = currentPage) => {
    try {
      setIsLoading(true);
      const filters: TaskFilterOptions = {
        page,
        pageSize
      };
      
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      // Call the API with pagination parameters and sorting
      const response = await fetch(`/api/projects/${project.id}/tasks?` + new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
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
    <div>
      <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="board">
          <ProjectKanbanBoard projectId={project.id} />
        </TabsContent>
        
        <TabsContent value="list">
          <div className="space-y-4">
            <SimpleSearch onSearch={handleSearch} />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5 text-gray-500" />
                  Task List
                </CardTitle>
              </CardHeader>
              <CardContent>
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
