"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  User,
  Calendar,
  Flag,
  MessageSquare,
  Plus,
  Check,
  MoreHorizontal,
  Edit,
  Clipboard,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { TaskWithMeta } from "@/types/task"
import type { SubtaskWithMeta } from "@/types/subtask"
import type { CommentWithMeta } from "@/types/comment"
import { getTaskById } from "@/lib/actions/task-actions"
import { getTaskSubtasks } from "@/lib/actions/subtask-actions"
import { getTaskComments, createComment } from "@/lib/actions/comment-actions"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface TaskDetailProps {
  _taskId: string
}

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
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Button>
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
              {typeof task.description === 'string' ? task.description : 
                <span className="text-gray-400 italic">No description provided</span>}
            </div>
          </div>

          {/* Subtasks section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Subtasks</h2>
              {!subtasksPermissionError && (
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subtask</span>
                </Button>
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
              {subtasks.length > 0 ? (
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
                      <p className={`font-medium ${subtask.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {subtask.title}
                      </p>
                      {subtask.description && (
                        <p className="text-sm text-gray-600 mt-1">{subtask.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{subtask.assigneeName || "Unassigned"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(subtask.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clipboard className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500 mb-2">
                    {subtasksPermissionError 
                      ? "You don't have permission to view subtasks" 
                      : "No subtasks yet"}
                  </p>
                  {!subtasksPermissionError && (
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add your first subtask</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comments section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Comments</h2>

            {/* Comment list */}
            <div className="space-y-6 mb-6">
              {comments.length > 0 ? (
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
                  <p className="text-gray-500">
                    {commentsPermissionError 
                      ? "You don't have permission to view comments" 
                      : "No comments yet"}
                  </p>
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
            <h3 className="text-sm font-medium text-gray-500 mb-4">Status</h3>
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
                <div className="flex items-center gap-1">
                  <Flag className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
                  <span className="text-sm font-medium">
                    {formatPriority(task.priority)}
                  </span>
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
            <h3 className="text-sm font-medium text-gray-500 mb-4">People</h3>
            <div className="space-y-4">
              {/* Assignee */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Assignee</span>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback>{getInitials(task.assigneeName || "Unassigned")}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{task.assigneeName || "Unassigned"}</span>
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
            <h3 className="text-sm font-medium text-gray-500 mb-4">Dates</h3>
            <div className="space-y-4">
              {/* Created */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Created</span>
                <span className="text-sm">{formatDate(task.createdAt)}</span>
              </div>
              
              {/* Due date */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Due Date</span>
                <span className="text-sm">{formatDate(task.dueDate)}</span>
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
            <h3 className="text-sm font-medium text-gray-500 mb-4">Labels</h3>
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
    </div>
  )
}

// Helper functions
function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    backlog: "bg-gray-100 text-gray-800",
    todo: "bg-blue-100 text-blue-800",
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
