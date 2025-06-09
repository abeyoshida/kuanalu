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
  Menu,
  X,
} from "lucide-react"
import type { Task, TaskPriority, TaskStatus } from "@/types/task"
import type { Subtask, Comment } from "@/types/task-details"

// Mock data - in a real app this would come from an API
const mockTask: Task & {
  subtasks: Subtask[]
  comments: Comment[]
  reporter: string
  labels: string[]
  storyPoints?: number
} = {
  id: "5",
  title: "Implement drag and drop functionality",
  description:
    "Add comprehensive drag and drop functionality to the kanban board. This includes visual feedback during dragging, proper drop zones, and state management for task movement between columns. The implementation should be smooth and intuitive for users.",
  status: "doing",
  priority: "high",
  assignee: "John Doe",
  reporter: "Sarah Wilson",
  createdAt: new Date("2024-01-19"),
  labels: ["frontend", "enhancement", "user-experience"],
  storyPoints: 8,
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
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: "c2",
      author: "John Doe",
      content: "I've completed the research phase. React DnD looks like the best option for our use case.",
      createdAt: new Date("2024-01-21T14:15:00"),
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: "c3",
      author: "Mike Johnson",
      content: "Make sure to test on mobile devices as well. Touch interactions can be tricky.",
      createdAt: new Date("2024-01-22T09:45:00"),
      avatar: "/placeholder.svg?height=32&width=32",
    },
  ],
}

const statusColors: Record<TaskStatus, string> = {
  todo: "bg-gray-100 text-gray-800",
  today: "bg-blue-100 text-blue-800",
  doing: "bg-yellow-100 text-yellow-800",
  blocked: "bg-red-100 text-red-800",
  done: "bg-green-100 text-green-800",
}

const priorityColors: Record<TaskPriority, string> = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-red-600",
}

interface TaskDetailProps {
  taskId: string
  toggleSidebar: () => void
  sidebarOpen: boolean
}

export default function TaskDetail({ taskId, toggleSidebar, sidebarOpen }: TaskDetailProps) {
  const [task] = useState(mockTask)
  const [newComment, setNewComment] = useState("")
  const [subtasks, setSubtasks] = useState(task.subtasks)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Board</span>
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">TaskFlow</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">TASK-{task.id}</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[task.status]}`}>
                      {task.status.toUpperCase()}
                    </span>
                    <Flag className={`w-4 h-4 ${priorityColors[task.priority]}`} />
                    <span className={`text-sm font-medium ${priorityColors[task.priority]}`}>
                      {task.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>TASK-{task.id}</span>
                    <span>•</span>
                    <span>Created {task.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              {/* Labels */}
              {task.labels && task.labels.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {task.labels.map((label) => (
                    <span key={label} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{task.description}</p>
              </div>
            </div>

            {/* Subtasks */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Subtasks</h3>
                  <p className="text-sm text-gray-600">
                    {completedSubtasks} of {totalSubtasks} completed
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subtask
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Subtask List */}
              <div className="space-y-3">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    <button
                      onClick={() => toggleSubtask(subtask.id)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        subtask.completed
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {subtask.completed && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1">
                      <h4
                        className={`font-medium ${subtask.completed ? "line-through text-gray-500" : "text-gray-900"}`}
                      >
                        {subtask.title}
                      </h4>
                      {subtask.description && (
                        <p className={`text-sm mt-1 ${subtask.completed ? "text-gray-400" : "text-gray-600"}`}>
                          {subtask.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{subtask.assignee}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{subtask.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({task.comments.length})
              </h3>

              {/* Add Comment */}
              <div className="mb-6">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-3"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  Add Comment
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={comment.avatar || "/placeholder.svg"}
                      alt={comment.author}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{comment.author}</span>
                        <span className="text-sm text-gray-500">
                          {comment.createdAt.toLocaleDateString()} at {comment.createdAt.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Assignee</label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{task.assignee}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Reporter</label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{task.reporter}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Priority</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Flag className={`w-4 h-4 ${priorityColors[task.priority]}`} />
                    <span className={`font-medium ${priorityColors[task.priority]}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[task.status]}`}>
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                {task.storyPoints && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Story Points</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{task.storyPoints}</span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{task.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Task
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Subtask
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
