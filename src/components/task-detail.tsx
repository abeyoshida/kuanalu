"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  User,
  Calendar as CalendarIcon,
  Flag,
  MessageSquare,
  Plus,
  Check,
  MoreHorizontal,
  Edit,
  Clipboard,
  AlertCircle,
  Loader2,
  UserPlus,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { TaskWithMeta, TaskStatus, TaskPriority } from "@/types/task"
import type { SubtaskWithMeta } from "@/types/subtask"
import type { CommentWithMeta } from "@/types/comment"
import { getTaskById, updateTask } from "@/lib/actions/task-actions"
import { getTaskSubtasks, createSubtask, updateSubtask } from "@/lib/actions/subtask-actions"
import { getTaskComments, createComment } from "@/lib/actions/comment-actions"
import { getProjectMembers } from "@/lib/actions/project-actions"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { PermissionError } from "@/components/ui/permission-error"

interface TaskDetailProps {
  _taskId: string
}

// First, let's create a helper function to format the description with line breaks
const formatDescriptionWithLineBreaks = (description: string): React.ReactNode => {
  return description.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < description.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));
};

export default function TaskDetail({ _taskId }: TaskDetailProps) {
  const router = useRouter()
  const [task, setTask] = useState<TaskWithMeta | null>(null)
  const [subtasks, setSubtasks] = useState<SubtaskWithMeta[]>([])
  const [comments, setComments] = useState<CommentWithMeta[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subtasksPermissionError, setSubtasksPermissionError] = useState(false)
  const [commentsPermissionError, setCommentsPermissionError] = useState(false)
  
  // Add state for the new subtask dialog
  const [isSubtaskDialogOpen, setIsSubtaskDialogOpen] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [newSubtaskDescription, setNewSubtaskDescription] = useState("")
  const [newSubtaskAssigneeId, setNewSubtaskAssigneeId] = useState<number | null>(null)
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false)

  // Add state for editing subtasks
  const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null)
  const [editSubtaskTitle, setEditSubtaskTitle] = useState("")
  const [editSubtaskDescription, setEditSubtaskDescription] = useState("")
  const [editSubtaskAssigneeId, setEditSubtaskAssigneeId] = useState<number | null>(null)
  const [isEditSubtaskDialogOpen, setIsEditSubtaskDialogOpen] = useState(false)
  const [isSubmittingEditSubtask, setIsSubmittingEditSubtask] = useState(false)

  // Add state for task editing
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false)
  const [editTaskTitle, setEditTaskTitle] = useState("")
  const [editTaskDescription, setEditTaskDescription] = useState("")
  const [editTaskStatus, setEditTaskStatus] = useState<TaskStatus>("todo")
  const [editTaskPriority, setEditTaskPriority] = useState<TaskPriority>("medium")
  const [isSubmittingEditTask, setIsSubmittingEditTask] = useState(false)

  // Add state for project members and assignment
  const [projectMembers, setProjectMembers] = useState<{ id: number; name: string; email: string }[]>([])
  const [isAssigningUser, setIsAssigningUser] = useState(false)
  
  // Add state for priority selection
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)
  
  // Add state for due date picker
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false)

  // Fetch task data when component mounts
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setIsLoading(true)
        
        // Reset permission errors
        setSubtasksPermissionError(false)
        setCommentsPermissionError(false)
        
        // Parse the task ID safely, handling potential NaN
        let taskId: number;
        try {
          taskId = parseInt(_taskId);
          if (isNaN(taskId)) {
            console.error("Invalid task ID format:", _taskId);
            setError(`Invalid task ID: ${_taskId}`);
            setIsLoading(false);
            return;
          }
        } catch (parseError) {
          console.error("Error parsing task ID:", parseError, "Raw ID:", _taskId);
          setError(`Error parsing task ID: ${_taskId}`);
          setIsLoading(false);
          return;
        }
        
        console.log("Fetching task with ID:", taskId);
        
        // Fetch task details
        try {
          const taskData = await getTaskById(taskId);
          
          if (!taskData) {
            console.error("Task not found for ID:", taskId);
            setError(`Task not found with ID: ${taskId}`);
            setIsLoading(false);
            return;
          }
          
          console.log("Task data retrieved:", taskData);
          setTask(taskData);
          
          // Fetch subtasks
          try {
            const subtasksData = await getTaskSubtasks(taskId);
            setSubtasks(subtasksData);
          } catch (subtaskError: unknown) {
            console.error("Error fetching subtasks:", subtaskError);
            // Check if it's a permission error
            if (subtaskError instanceof Error && subtaskError.message?.includes("permission")) {
              setSubtasksPermissionError(true);
            }
            // Don't set an error state for subtasks, just show an empty state with a message
            setSubtasks([]);
          }
          
          // Fetch comments
          try {
            const commentsData = await getTaskComments(taskId);
            setComments(commentsData);
          } catch (commentError: unknown) {
            console.error("Error fetching comments:", commentError);
            // Check if it's a permission error
            if (commentError instanceof Error && commentError.message?.includes("permission")) {
              setCommentsPermissionError(true);
            }
            // Don't set an error state for comments, just show an empty state with a message
            setComments([]);
          }
        } catch (taskError: unknown) {
          console.error("Error fetching task:", taskError);
          // Check if the error is related to authentication
          if (taskError instanceof Error && taskError.message?.includes("logged in")) {
            setError("You must be logged in to view task details");
            // Redirect to login page after a short delay
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
          } else if (taskError instanceof Error) {
            setError(taskError.message || "Failed to load task details");
          } else {
            setError("Failed to load task details");
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskData();
  }, [_taskId, router]);

  // Add function to fetch project members
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!task) return;
      
      try {
        const members = await getProjectMembers(task.projectId);
        setProjectMembers(members);
      } catch (error) {
        console.error("Error fetching project members:", error);
      }
    };
    
    if (task) {
      fetchProjectMembers();
    }
  }, [task]);

  const toggleSubtask = async (subtaskId: number) => {
    try {
      // Find the subtask to toggle
      const subtask = subtasks.find(st => st.id === subtaskId);
      if (!subtask) return;

      // Optimistically update UI
      setSubtasks(prev =>
        prev.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
      );

      // In a real app, make API call to update the subtask
      try {
        // Call the API to update the subtask
        const response = await fetch(`/api/subtasks/${subtaskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: !subtask.completed })
        });
        
        if (!response.ok) {
          // Check if it's a permission error
          const errorData = await response.json();
          
          if (errorData.error?.includes("permission")) {
            setSubtasksPermissionError(true);
            // Revert the optimistic update
            setSubtasks(prev =>
              prev.map(st => st.id === subtaskId ? { ...st, completed: subtask.completed } : st)
            );
            
            toast({
              title: "Permission denied",
              description: "You don't have permission to update this subtask",
              variant: "destructive"
            });
            return;
          }
          
          throw new Error('Failed to update subtask');
        }
      } catch (error: unknown) {
        console.error("Error updating subtask:", error);
        
        // Revert the optimistic update
        setSubtasks(prev =>
          prev.map(st => st.id === subtaskId ? { ...st, completed: subtask.completed } : st)
        );
        
        // Check if it's a permission error
        if (error instanceof Error && error.message?.includes("permission")) {
          setSubtasksPermissionError(true);
          toast({
            title: "Permission denied",
            description: "You don't have permission to update subtasks",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update subtask",
            variant: "destructive"
          });
        }
       }
    } catch (error: unknown) {
      console.error("Error updating subtask:", error);
      toast({
        title: "Error",
        description: "Failed to update subtask",
        variant: "destructive"
      });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;

    try {
      // In a real app, make API call to add the comment
      try {
        const response = await createComment({
          content: newComment,
          taskId: task.id,
        });
        
        // Optimistically update UI
        setComments(prev => [...prev, response]);
        setNewComment("");
        
        toast({
          title: "Comment added",
          description: "Your comment has been added successfully",
        });
      } catch (error: unknown) {
        console.error("Error adding comment:", error);
        
        // Check if it's a permission error
        if (error instanceof Error && error.message?.includes("permission")) {
          setCommentsPermissionError(true);
          toast({
            title: "Permission denied",
            description: "You don't have permission to add comments to this task",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add comment",
            variant: "destructive"
          });
        }
      }
    } catch (error: unknown) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Not set";
    
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return String(date);
    }
  };

  // Calculate progress for subtasks
  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const totalSubtasks = subtasks.length;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  // Add function to handle subtask creation
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !task) return;
    
    try {
      setIsSubmittingSubtask(true);
      
      const response = await createSubtask({
        title: newSubtaskTitle,
        description: newSubtaskDescription || undefined,
        taskId: task.id,
        assigneeId: newSubtaskAssigneeId || undefined
      });
      
      // Add the new subtask to the list
      setSubtasks(prev => [...prev, response]);
      
      // Reset form and close dialog
      setNewSubtaskTitle("");
      setNewSubtaskDescription("");
      setNewSubtaskAssigneeId(null);
      setIsSubtaskDialogOpen(false);
      
      toast({
        title: "Subtask added",
        description: "Your subtask has been added successfully",
      });
    } catch (error: unknown) {
      console.error("Error adding subtask:", error);
      
      if (error instanceof Error && error.message?.includes("permission")) {
        setSubtasksPermissionError(true);
        toast({
          title: "Permission denied",
          description: "You don't have permission to add subtasks to this task",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add subtask",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmittingSubtask(false);
    }
  };

  // Add function to open the edit subtask dialog
  const openEditSubtaskDialog = (subtask: SubtaskWithMeta) => {
    setEditingSubtaskId(subtask.id);
    setEditSubtaskTitle(subtask.title);
    setEditSubtaskDescription(subtask.description || "");
    setEditSubtaskAssigneeId(subtask.assigneeId || null);
    setIsEditSubtaskDialogOpen(true);
  };

  // Add function to handle subtask update
  const handleUpdateSubtask = async () => {
    if (!editingSubtaskId || !editSubtaskTitle.trim()) return;
    
    try {
      setIsSubmittingEditSubtask(true);
      
      const response = await updateSubtask(editingSubtaskId, {
        title: editSubtaskTitle,
        description: editSubtaskDescription || null,
        assigneeId: editSubtaskAssigneeId
      });
      
      if (!response.success) {
        // Handle error based on type
        if (response.isPermissionError) {
          setSubtasksPermissionError(true);
          toast({
            title: "Permission denied",
            description: response.message || "You don't have permission to update subtasks for this task",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to update subtask",
            variant: "destructive"
          });
        }
        return;
      }
      
      // Update the subtask in the list
      setSubtasks(prev => 
        prev.map(st => st.id === editingSubtaskId ? response.data! : st)
      );
      
      // Reset form and close dialog
      setIsEditSubtaskDialogOpen(false);
      
      toast({
        title: "Subtask updated",
        description: "Your subtask has been updated successfully",
      });
    } catch (error: unknown) {
      console.error("Error updating subtask:", error);
      
      if (error instanceof Error && error.message?.includes("permission")) {
        setSubtasksPermissionError(true);
        toast({
          title: "Permission denied",
          description: "You don't have permission to update subtasks for this task",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update subtask",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmittingEditSubtask(false);
      setEditingSubtaskId(null);
      setEditSubtaskTitle("");
      setEditSubtaskDescription("");
      setEditSubtaskAssigneeId(null);
    }
  };

  // Add function to open the edit task dialog
  const openEditTaskDialog = () => {
    if (!task) return;
    
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || "");
    setEditTaskStatus(task.status as TaskStatus);
    setEditTaskPriority(task.priority as TaskPriority);
    setIsEditTaskDialogOpen(true);
  };

  // Add function to handle task update
  const handleUpdateTask = async () => {
    if (!task || !editTaskTitle.trim()) return;
    
    try {
      setIsSubmittingEditTask(true);
      
      const response = await updateTask(task.id, {
        title: editTaskTitle,
        description: editTaskDescription || null,
        status: editTaskStatus,
        priority: editTaskPriority
      });
      
      if (!response.success) {
        // Handle error based on type
        if (response.isPermissionError) {
          toast({
            title: "Permission denied",
            description: response.message || "You don't have permission to update this task",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to update task",
            variant: "destructive"
          });
        }
        return;
      }
      
      // Update the task in state
      if (response.data) {
        setTask(response.data);
      }
      
      // Reset form and close dialog
      setIsEditTaskDialogOpen(false);
      
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully",
      });
    } catch (error: unknown) {
      console.error("Error updating task:", error);
      
      if (error instanceof Error && error.message?.includes("permission")) {
        toast({
          title: "Permission denied",
          description: "You don't have permission to update this task",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update task",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmittingEditTask(false);
    }
  };

  // Add function to handle assignee change
  const handleAssigneeChange = async (userId: number | null) => {
    if (!task) return;
    
    try {
      setIsAssigningUser(true);
      
      const response = await updateTask(task.id, {
        assigneeId: userId
      });
      
      if (!response.success) {
        if (response.isPermissionError) {
          toast({
            title: "Permission denied",
            description: response.message || "You don't have permission to assign this task",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to assign task",
            variant: "destructive"
          });
        }
        return;
      }
      
      // Update the task in state
      if (response.data) {
        setTask(response.data);
      }
      
      toast({
        title: "Task assigned",
        description: userId 
          ? `Task assigned to ${projectMembers.find(m => m.id === userId)?.name || 'user'}`
          : "Task unassigned",
      });
    } catch (error: unknown) {
      console.error("Error assigning task:", error);
      
      if (error instanceof Error && error.message?.includes("permission")) {
        toast({
          title: "Permission denied",
          description: "You don't have permission to assign this task",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to assign task",
          variant: "destructive"
        });
      }
    } finally {
      setIsAssigningUser(false);
    }
  };

  // Add function to handle priority change
  const handlePriorityChange = async (priority: TaskPriority) => {
    if (!task) return;
    
    try {
      setIsUpdatingPriority(true);
      
      const response = await updateTask(task.id, {
        priority: priority
      });
      
      if (!response.success) {
        if (response.isPermissionError) {
          toast({
            title: "Permission denied",
            description: response.message || "You don't have permission to update this task's priority",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to update priority",
            variant: "destructive"
          });
        }
        return;
      }
      
      // Update the task in state
      if (response.data) {
        setTask(response.data);
      }
      
      toast({
        title: "Priority updated",
        description: `Task priority set to ${formatPriority(priority)}`,
      });
    } catch (error: unknown) {
      console.error("Error updating priority:", error);
      
      if (error instanceof Error && error.message?.includes("permission")) {
        toast({
          title: "Permission denied",
          description: "You don't have permission to update this task's priority",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update priority",
          variant: "destructive"
        });
      }
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  // Add function to handle due date change
  const handleDueDateChange = async (date: Date | undefined) => {
    if (!task) return;
    
    try {
      setIsUpdatingDueDate(true);
      
      const response = await updateTask(task.id, {
        dueDate: date || null
      });
      
      if (!response.success) {
        if (response.isPermissionError) {
          toast({
            title: "Permission denied",
            description: response.message || "You don't have permission to update this task's due date",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to update due date",
            variant: "destructive"
          });
        }
        return;
      }
      
      // Update the task in state
      if (response.data) {
        setTask(response.data);
      }
      
      toast({
        title: "Due date updated",
        description: date 
          ? `Due date set to ${formatDate(date)}`
          : "Due date removed",
      });
    } catch (error: unknown) {
      console.error("Error updating due date:", error);
      
      if (error instanceof Error && error.message?.includes("permission")) {
        toast({
          title: "Permission denied",
          description: "You don't have permission to update this task's due date",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update due date",
          variant: "destructive"
        });
      }
    } finally {
      setIsUpdatingDueDate(false);
      setIsDatePickerOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading task details...</span>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{error || "Task not found"}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  // Get project ID from task or default to 1
  const projectId = task.projectId || 1

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href={`/projects/${projectId}`} className="text-gray-500 hover:text-gray-900 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Board</span>
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-500">Project {projectId}</span>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">TASK-{task.id}</span>
      </div>

      {/* Task content - 2 column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-900">{task.title}</h1>
              <div className="flex items-center gap-2">
                <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={openEditTaskDialog}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Edit Task</DialogTitle>
                      <DialogDescription>
                        Make changes to the task. Click save when you&apos;re done.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-task-title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="edit-task-title"
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          className="col-span-3"
                          placeholder="Enter task title"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-task-status" className="text-right">
                          Status
                        </Label>
                        <Select
                          value={editTaskStatus}
                          onValueChange={(value) => setEditTaskStatus(value as TaskStatus)}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">Todo</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-task-priority" className="text-right">
                          Priority
                        </Label>
                        <Select
                          value={editTaskPriority}
                          onValueChange={(value) => setEditTaskPriority(value as TaskPriority)}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-task-description" className="text-right">
                          Description
                        </Label>
                        <Textarea
                          id="edit-task-description"
                          value={editTaskDescription}
                          onChange={(e) => setEditTaskDescription(e.target.value)}
                          className="col-span-3"
                          placeholder="Enter task description"
                          rows={5}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={handleUpdateTask} 
                        disabled={!editTaskTitle.trim() || isSubmittingEditTask}
                      >
                        {isSubmittingEditTask ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" className="p-0 w-8 h-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className={getStatusColor(task.status)}>
                {formatStatus(task.status)}
              </Badge>
              {task.labels && Array.isArray(task.labels) ? renderLabels(task.labels) : null}
            </div>

            <div className="prose max-w-none text-gray-700 mb-6">
              {typeof task.description === 'string' && task.description ? 
                formatDescriptionWithLineBreaks(task.description) : 
                <span className="text-gray-400 italic">No description provided</span>}
            </div>
          </div>

          {/* Subtasks section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Subtasks</h2>
              {!subtasksPermissionError && (
                <Dialog open={isSubtaskDialogOpen} onOpenChange={setIsSubtaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Subtask</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Subtask</DialogTitle>
                      <DialogDescription>
                        Create a new subtask for this task. Click save when you&apos;re done.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subtask-title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="subtask-title"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          className="col-span-3"
                          placeholder="Enter subtask title"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subtask-description" className="text-right">
                          Description
                        </Label>
                        <Textarea
                          id="subtask-description"
                          value={newSubtaskDescription}
                          onChange={(e) => setNewSubtaskDescription(e.target.value)}
                          className="col-span-3"
                          placeholder="Enter subtask description (optional)"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subtask-assignee" className="text-right">
                          Assignee
                        </Label>
                        <div className="col-span-3">
                          <Select
                            value={newSubtaskAssigneeId ? String(newSubtaskAssigneeId) : "unassigned"}
                            onValueChange={(value) => {
                              const assigneeId = value === "unassigned" ? null : parseInt(value);
                              setNewSubtaskAssigneeId(assigneeId);
                            }}
                          >
                            <SelectTrigger id="subtask-assignee">
                              <SelectValue>
                                {newSubtaskAssigneeId ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback>
                                        {getInitials(projectMembers.find(m => m.id === newSubtaskAssigneeId)?.name || "")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">
                                      {projectMembers.find(m => m.id === newSubtaskAssigneeId)?.name || "Unknown User"}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <UserPlus className="h-4 w-4 text-gray-400" />
                                    <span>Unassigned</span>
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">
                                <div className="flex items-center gap-2">
                                  <UserPlus className="h-4 w-4 text-gray-400" />
                                  <span>Unassigned</span>
                                </div>
                              </SelectItem>
                              {projectMembers.map((member) => (
                                <SelectItem key={member.id} value={String(member.id)}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                    </Avatar>
                                    <span>{member.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={handleAddSubtask} 
                        disabled={!newSubtaskTitle.trim() || isSubmittingSubtask}
                      >
                        {isSubmittingSubtask ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Subtask"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Progress bar - only show if we have subtasks */}
            {subtasks.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">
                    Progress: {completedSubtasks}/{totalSubtasks}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Subtasks list */}
            <div className="space-y-2">
              {subtasksPermissionError ? (
                <PermissionError 
                  resource="subtasks"
                  action="view"
                  showBackButton={false}
                  message="You don't have permission to view or manage subtasks for this task."
                />
              ) : subtasks.length > 0 ? (
                subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="pt-0.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`p-0 w-5 h-5 rounded-sm ${
                          subtask.completed ? "bg-blue-600 text-white border-blue-600" : ""
                        }`}
                        onClick={() => toggleSubtask(subtask.id)}
                      >
                        {subtask.completed && <Check className="w-3 h-3" />}
                      </Button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className={`font-medium ${subtask.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                          {subtask.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          onClick={() => openEditSubtaskDialog(subtask)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {subtask.description && (
                        <p className="text-sm text-gray-600 mt-1">{subtask.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{subtask.assigneeName || "Unassigned"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{formatDate(subtask.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clipboard className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500 mb-2">No subtasks yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={() => setIsSubtaskDialogOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add your first subtask</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Comments section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Comments</h2>

            {/* Comment list */}
            <div className="space-y-6 mb-6">
              {commentsPermissionError ? (
                <PermissionError 
                  resource="comments"
                  action="view"
                  showBackButton={false}
                  message="You don't have permission to view or add comments for this task."
                />
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.userImage || ""} alt={comment.userName || ""} />
                      <AvatarFallback>{getInitials(comment.userName || "")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{comment.userName || "Unknown User"}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </div>
                      </div>
                      <div className="mt-1 text-gray-700">{comment.content}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500">No comments yet</p>
                </div>
              )}
            </div>

            {/* Add comment - only show if we have permission */}
            {!commentsPermissionError && (
              <div className="flex gap-4">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px] mb-2"
                  />
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    Add Comment
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Task metadata */}
        <div className="space-y-6">
          {/* Status and actions card */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Status</h3>
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Current Status</span>
                <Badge variant="secondary" className={getStatusColor(task.status)}>
                  {formatStatus(task.status)}
                </Badge>
              </div>
              
              {/* Priority */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Priority</span>
                <div className="w-[140px]">
                  <Select
                    value={task.priority}
                    onValueChange={(value) => handlePriorityChange(value as TaskPriority)}
                    disabled={isUpdatingPriority}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue>
                        {isUpdatingPriority ? (
                          <div className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Updating...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Flag className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
                            <span>{formatPriority(task.priority)}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="flex items-center gap-1">
                        <div className="flex items-center gap-1">
                          <Flag className="w-3 h-3 text-green-600" />
                          <span>Low</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium" className="flex items-center gap-1">
                        <div className="flex items-center gap-1">
                          <Flag className="w-3 h-3 text-yellow-600" />
                          <span>Medium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high" className="flex items-center gap-1">
                        <div className="flex items-center gap-1">
                          <Flag className="w-3 h-3 text-red-600" />
                          <span>High</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent" className="flex items-center gap-1">
                        <div className="flex items-center gap-1">
                          <Flag className="w-3 h-3 text-purple-600" />
                          <span>Urgent</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Story points */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Story Points</span>
                <Badge variant="outline" className="font-medium">
                  {task.points || "Not set"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* People card */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">People</h3>
            <div className="space-y-4">
              {/* Assignee */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Assignee</span>
                <div className="w-[180px]">
                  <Select
                    value={task?.assigneeId ? String(task.assigneeId) : "unassigned"}
                    onValueChange={(value) => {
                      const assigneeId = value === "unassigned" ? null : parseInt(value);
                      handleAssigneeChange(assigneeId);
                    }}
                    disabled={isAssigningUser}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {isAssigningUser ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Assigning...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {task?.assigneeId ? (
                              <Avatar className="h-5 w-5">
                                <AvatarFallback>{getInitials(task.assigneeName || "")}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <UserPlus className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="truncate">
                              {task?.assigneeName || "Unassigned"}
                            </span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-gray-400" />
                          <span>Unassigned</span>
                        </div>
                      </SelectItem>
                      {projectMembers.map((member) => (
                        <SelectItem key={member.id} value={String(member.id)}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <span>{member.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Reporter */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Reporter</span>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback>{getInitials(task.reporterName || "Unknown")}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{task.reporterName || "Unknown"}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Dates card */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Dates</h3>
            <div className="space-y-4">
              {/* Created */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Created</span>
                <span className="text-sm">{formatDate(task.createdAt)}</span>
              </div>
              
              {/* Due date */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Due Date</span>
                <div>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={cn(
                          "flex items-center gap-1 h-8 px-2 text-xs",
                          !task.dueDate && "text-gray-500",
                          isUpdatingDueDate && "opacity-70 cursor-not-allowed"
                        )}
                        disabled={isUpdatingDueDate}
                      >
                        {isUpdatingDueDate ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CalendarIcon className="h-3 w-3" />
                        )}
                        {task.dueDate ? formatDate(task.dueDate) : "Set due date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={task.dueDate ? new Date(task.dueDate) : undefined}
                        onSelect={handleDueDateChange}
                        initialFocus
                        required={false}
                      />
                      {task.dueDate && (
                        <div className="p-2 border-t flex justify-between items-center">
                          <span className="text-xs text-gray-500">Clear due date</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDueDateChange(undefined)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Updated */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Last Updated</span>
                <span className="text-sm">{formatDate(task.updatedAt)}</span>
              </div>
            </div>
          </Card>

          {/* Tags/Labels card */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Labels</h3>
            <div className="flex flex-wrap gap-2">
              {task.labels && Array.isArray(task.labels) ? 
                task.labels.length > 0 ? renderLabels(task.labels) : <span className="text-sm text-gray-500">No labels</span>
              : <span className="text-sm text-gray-500">No labels</span>}
              <Button variant="outline" size="sm" className="h-6 px-2">
                <Plus className="w-3 h-3 mr-1" />
                <span className="text-xs">Add Label</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Edit Subtask Dialog */}
      <Dialog open={isEditSubtaskDialogOpen} onOpenChange={setIsEditSubtaskDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subtask</DialogTitle>
            <DialogDescription>
              Make changes to the subtask. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-subtask-title" className="text-right">
                Title
              </Label>
              <Input
                id="edit-subtask-title"
                value={editSubtaskTitle}
                onChange={(e) => setEditSubtaskTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter subtask title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-subtask-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-subtask-description"
                value={editSubtaskDescription}
                onChange={(e) => setEditSubtaskDescription(e.target.value)}
                className="col-span-3"
                placeholder="Enter subtask description (optional)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-subtask-assignee" className="text-right">
                Assignee
              </Label>
              <div className="col-span-3">
                <Select
                  value={editSubtaskAssigneeId ? String(editSubtaskAssigneeId) : "unassigned"}
                  onValueChange={(value) => {
                    const assigneeId = value === "unassigned" ? null : parseInt(value);
                    setEditSubtaskAssigneeId(assigneeId);
                  }}
                >
                  <SelectTrigger id="edit-subtask-assignee">
                    <SelectValue>
                      {editSubtaskAssigneeId ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback>
                              {getInitials(projectMembers.find(m => m.id === editSubtaskAssigneeId)?.name || "")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">
                            {projectMembers.find(m => m.id === editSubtaskAssigneeId)?.name || "Unknown User"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-gray-400" />
                          <span>Unassigned</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-gray-400" />
                        <span>Unassigned</span>
                      </div>
                    </SelectItem>
                    {projectMembers.map((member) => (
                      <SelectItem key={member.id} value={String(member.id)}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleUpdateSubtask} 
              disabled={!editSubtaskTitle.trim() || isSubmittingEditSubtask}
            >
              {isSubmittingEditSubtask ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper functions
function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    todo: "bg-gray-100 text-gray-800",
    today: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    in_review: "bg-orange-100 text-orange-800",
    done: "bg-green-100 text-green-800",
  }
  
  return statusColors[status] || "bg-gray-100 text-gray-800"
}

function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-red-600",
    urgent: "text-purple-600",
  }
  
  return priorityColors[priority] || "text-gray-600"
}

function formatStatus(status: string): string {
  if (!status) return "Unknown"
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
}

function formatPriority(priority: string): string {
  if (!priority) return "None"
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

function getInitials(name: string): string {
  if (!name) return "?"
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getLabelText(label: unknown): string {
  if (typeof label === 'string') {
    return label
  }
  
  if (typeof label === 'object' && label !== null) {
    if ('name' in label && typeof label.name === 'string') {
      return label.name
    }
  }
  
  return String(label || '')
}

function renderLabels(labels: unknown[] | undefined) {
  if (!labels || !Array.isArray(labels) || labels.length === 0) {
    return null;
  }
  
  return labels.map((label, index) => {
    const labelText = getLabelText(label);
    return (
      <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        {labelText}
      </Badge>
    );
  });
}
