'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowUpDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  TaskWithMeta, 
  TaskSortField, 
  SortDirection, 
  TaskSortOption
} from '@/types/task';

interface TaskListProps {
  tasks: TaskWithMeta[];
  onSortChange?: (sortOption: TaskSortOption) => void;
}

export default function TaskList({ 
  tasks, 
  onSortChange
}: TaskListProps) {
  const [sortField, setSortField] = useState<TaskSortField>(TaskSortField.PRIORITY);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.DESC);

  // Handle sort change
  const handleSort = (field: TaskSortField) => {
    const newDirection = field === sortField && sortDirection === SortDirection.ASC 
      ? SortDirection.DESC 
      : SortDirection.ASC;
    
    setSortField(field);
    setSortDirection(newDirection);
    
    if (onSortChange) {
      onSortChange({ field, direction: newDirection });
    }
  };

  // Sort tasks client-side if needed
  const sortedTasks = useMemo(() => {
    if (!onSortChange) {
      // If no server-side sorting is provided, sort client-side
      return [...tasks].sort((a, b) => {
        let valueA, valueB;
        
        switch (sortField) {
          case TaskSortField.TITLE:
            valueA = a.title?.toLowerCase() || '';
            valueB = b.title?.toLowerCase() || '';
            break;
          case TaskSortField.STATUS:
            valueA = a.status || '';
            valueB = b.status || '';
            break;
          case TaskSortField.PRIORITY:
            // Map priority to numeric values for sorting
            const priorityMap: Record<string, number> = {
              urgent: 4,
              high: 3,
              medium: 2,
              low: 1
            };
            valueA = priorityMap[a.priority || 'medium'] || 0;
            valueB = priorityMap[b.priority || 'medium'] || 0;
            break;
          case TaskSortField.DUE_DATE:
            valueA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            valueB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            break;
          case TaskSortField.CREATED_AT:
            valueA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            valueB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            break;
          case TaskSortField.UPDATED_AT:
            valueA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            valueB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            break;
          case TaskSortField.ASSIGNEE:
            valueA = a.assigneeName?.toLowerCase() || '';
            valueB = b.assigneeName?.toLowerCase() || '';
            break;
          default:
            return 0;
        }
        
        // Apply sort direction
        const compareResult = typeof valueA === 'string'
          ? valueA.localeCompare(valueB as string)
          : (valueA as number) - (valueB as number);
        
        return sortDirection === SortDirection.ASC ? compareResult : -compareResult;
      });
    }
    
    return tasks;
  }, [tasks, sortField, sortDirection, onSortChange]);

  // Helper function to render priority badge
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-green-500 text-green-700">Low</Badge>;
      default:
        return <Badge variant="outline">Medium</Badge>;
    }
  };

  // Helper function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'backlog':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Backlog</Badge>;
      case 'todo':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">To Do</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">In Progress</Badge>;
      case 'in_review':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">In Review</Badge>;
      case 'done':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Done</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Helper function to render due date with status
  const renderDueDate = (task: TaskWithMeta) => {
    if (!task.dueDate) return <span className="text-gray-400">No due date</span>;
    
    const dueDate = new Date(task.dueDate);
    const formattedDate = dueDate.toLocaleDateString();
    const relativeDate = formatDistanceToNow(dueDate, { addSuffix: true });
    
    if (task.isOverdue) {
      return (
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{formattedDate} ({relativeDate})</span>
        </div>
      );
    }
    
    if (task.status === 'done') {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          <span>{formattedDate}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-1 text-gray-400" />
        <span>{formattedDate} ({relativeDate})</span>
      </div>
    );
  };

  // Render sort indicator
  const renderSortIndicator = (field: TaskSortField) => {
    if (field !== sortField) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    
    return sortDirection === SortDirection.ASC 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[400px]">
              <Button 
                variant="ghost" 
                onClick={() => handleSort(TaskSortField.TITLE)}
                className="flex items-center"
              >
                Task {renderSortIndicator(TaskSortField.TITLE)}
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort(TaskSortField.STATUS)}
                className="flex items-center"
              >
                Status {renderSortIndicator(TaskSortField.STATUS)}
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort(TaskSortField.PRIORITY)}
                className="flex items-center"
              >
                Priority {renderSortIndicator(TaskSortField.PRIORITY)}
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort(TaskSortField.ASSIGNEE)}
                className="flex items-center"
              >
                Assignee {renderSortIndicator(TaskSortField.ASSIGNEE)}
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => handleSort(TaskSortField.DUE_DATE)}
                className="flex items-center"
              >
                Due Date {renderSortIndicator(TaskSortField.DUE_DATE)}
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No tasks found
              </TableCell>
            </TableRow>
          ) : (
            sortedTasks.map((task) => (
              <TableRow key={task.id} className="hover:bg-gray-50">
                <TableCell>
                  <Link href={`/task/${task.id}`} className="hover:underline font-medium">
                    {task.title}
                  </Link>
                  {task.subtaskCount && task.subtaskCount > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {task.subtaskCount} subtask{task.subtaskCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{renderStatusBadge(task.status)}</TableCell>
                <TableCell>{renderPriorityBadge(task.priority)}</TableCell>
                <TableCell>
                  {task.assigneeName || <span className="text-gray-400">Unassigned</span>}
                </TableCell>
                <TableCell>{renderDueDate(task)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
