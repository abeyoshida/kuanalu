"use client"

import { useState } from "react"
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
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Tag,
  Clipboard,
  AlertCircle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import type { Task, TaskPriority, TaskStatus } from "@/types/tasks"
import type { Subtask, Comment } from "@/types/task-details"
import { getTaskById } from "@/lib/actions/task-actions"
import { useRouter } from "next/navigation"

// Mock data - in a real app this would come from an API
const mockTask: Task & {
  subtasks: Subtask[]
  comments: Comment[]
  reporter: string
  labels: string[]
  storyPoints?: number
  projectId: number
} = {
  id: "5",
  title: "Implement drag and drop functionality",
  description:
    "Add comprehensive drag and drop functionality to the kanban board. This includes visual feedback during dragging, proper drop zones, and state management for task movement between columns. The implementation should be smooth and intuitive for users.",
  status: "in_progress",
  priority: "high",
  assignee: "John Doe",
  reporter: "Sarah Wilson",
  createdAt: new Date("2024-01-19"),
  labels: ["frontend", "enhancement", "user-experience"],
  storyPoints: 8,
  projectId: 1,
  subtasks: [
    {
      id: "5-1",
      title: "Research drag and drop libraries",
      description: "Evaluate different drag and drop libraries for React",
      completed: true,
      assignee: "John Doe",
      createdAt: new Date("2024-01-19"),
    },
    {
      id: "5-2",
      title: "Implement basic drag functionality",
      description: "Add draggable attribute and drag event handlers",
      completed: true,
      assignee: "John Doe",
      createdAt: new Date("2024-01-20"),
    },
    {
      id: "5-3",
      title: "Add visual feedback during drag",
      description: "Show visual indicators when dragging tasks",
      completed: false,
      assignee: "John Doe",
      createdAt: new Date("2024-01-21"),
    },
    {
      id: "5-4",
      title: "Implement drop zones",
      description: "Create proper drop zones for each column",
      completed: false,
      assignee: "John Doe",
      createdAt: new Date("2024-01-21"),
    },
    {
      id: "5-5",
      title: "Add state management for task movement",
      description: "Update task status when moved between columns",
      completed: false,
      assignee: "John Doe",
      createdAt: new Date("2024-01-22"),
    },
    {
      id: "5-6",
      title: "Write tests for drag and drop",
      description: "Create comprehensive test suite for drag and drop functionality",
      completed: false,
      assignee: "Jane Smith",
      createdAt: new Date("2024-01-22"),
    },
  ],
  comments: [
    {
      id: "c1",
      author: "Sarah Wilson",
      content: "This is a critical feature for user experience. Please prioritize the visual feedback implementation.",
      createdAt: new Date("2024-01-20T10:30:00"),
      avatar: "/placeholder.svg",
    },
    {
      id: "c2",
      author: "John Doe",
      content: "I've completed the research phase. React DnD looks like the best option for our use case.",
      createdAt: new Date("2024-01-21T14:15:00"),
      avatar: "/placeholder.svg",
    },
    {
      id: "c3",
      author: "Mike Johnson",
      content: "Make sure to test on mobile devices as well. Touch interactions can be tricky.",
      createdAt: new Date("2024-01-22T09:45:00"),
      avatar: "/placeholder.svg",
    },
  ],
}

const statusColors: Record<TaskStatus, string> = {
  backlog: "bg-gray-100 text-gray-800",
  todo: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  in_review: "bg-orange-100 text-orange-800",
  done: "bg-green-100 text-green-800",
}

const priorityColors: Record<TaskPriority, string> = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-red-600",
  urgent: "text-purple-600",
}

interface TaskDetailProps {
  _taskId: string
}

export default function TaskDetail({ _taskId }: TaskDetailProps) {
  const router = useRouter()
  const [task] = useState(mockTask)
  const [newComment, setNewComment] = useState("")
  const [subtasks, setSubtasks] = useState(task.subtasks)
  const [isLoading, setIsLoading] = useState(false)

  // In a real app, we would fetch the task data based on the _taskId
  // const fetchTaskData = async () => {
  //   try {
  //     setIsLoading(true)
  //     const taskData = await getTaskById(parseInt(_taskId))
  //     if (taskData) {
  //       // Set task data
  //     } else {
  //       // Handle not found
  //     }
  //   } catch (error) {
  //     console.error("Error fetching task:", error)
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  // useEffect(() => {
  //   fetchTaskData()
  // }, [_taskId])

  // For demo purposes, we'll use a mock project ID
  const projectId = task.projectId || 1;

  const toggleSubtask = (subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((subtask) => (subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask)),
    )
  }

  const completedSubtasks = subtasks.filter((st) => st.completed).length
  const totalSubtasks = subtasks.length
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  const handleAddComment = () => {
    if (newComment.trim()) {
      // In a real app, this would make an API call
      console.log("Adding comment:", newComment)
      setNewComment("")
    }
  }

  const formatDate = (date: Date | string) => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return String(date);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading task details...</div>
  }

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
              <Badge variant="secondary" className={statusColors[task.status]}>
                {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              {task.labels.map((label) => (
                <Badge key={label} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {label}
                </Badge>
              ))}
            </div>

            <div className="prose max-w-none text-gray-700 mb-6">
              {task.description}
            </div>
          </div>

          {/* Subtasks section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Subtasks</h2>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subtask</span>
              </Button>
            </div>

            {/* Progress bar */}
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

            {/* Subtasks list */}
            <div className="space-y-2">
              {subtasks.map((subtask) => (
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
                        <span>{subtask.assignee}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(subtask.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Comments</h2>

            {/* Comment list */}
            <div className="space-y-6 mb-6">
              {task.comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.avatar} alt={comment.author} />
                    <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900">{comment.author}</div>
                      <div className="text-xs text-gray-500">
                        {comment.createdAt.toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-1 text-gray-700">{comment.content}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
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
                <Badge variant="secondary" className={statusColors[task.status]}>
                  {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
              
              {/* Priority */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Priority</span>
                <div className="flex items-center gap-1">
                  <Flag className={`w-4 h-4 ${priorityColors[task.priority]}`} />
                  <span className="text-sm font-medium">
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </div>
              </div>
              
              {/* Story points */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Story Points</span>
                <Badge variant="outline" className="font-medium">
                  {task.storyPoints}
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
                    <AvatarFallback>{task.assignee.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{task.assignee}</span>
                </div>
              </div>
              
              {/* Reporter */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Reporter</span>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback>{task.reporter.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{task.reporter}</span>
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
              
              {/* Due date - mocked */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Due Date</span>
                <span className="text-sm">Not set</span>
              </div>
            </div>
          </Card>

          {/* Tags/Labels card */}
          <Card className="p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Labels</h3>
            <div className="flex flex-wrap gap-2">
              {task.labels.map((label) => (
                <Badge key={label} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {label}
                </Badge>
              ))}
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
