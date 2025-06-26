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
} from "lucide-react"
import type { Task, TaskPriority, TaskStatus } from "@/types/tasks"
import type { Subtask, Comment } from "@/types/task-details"
import Image from "next/image"

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
  urgent: "text-purple-600",
}

interface TaskDetailProps {
  _taskId: string
}

export default function TaskDetail({ _taskId }: TaskDetailProps) {
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

  const formatDate = (date: Date | string) => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return String(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/projects" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Board</span>
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">TaskFlow</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">TASK-{task.id}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Task Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{task.title}</h1>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                  {task.storyPoints} points
                </span>
                {task.labels.map((label) => (
                  <span
                    key={label}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="prose max-w-none text-gray-700 mb-6">{task.description}</div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Assignee:</span>
                  <span className="font-medium">{task.assignee}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Reporter:</span>
                  <span className="font-medium">{task.reporter}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">{formatDate(task.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className={`w-4 h-4 ${priorityColors[task.priority]}`} />
                  <span className="text-gray-500">Priority:</span>
                  <span className="font-medium">{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                </div>
              </div>
            </div>

            {/* Subtasks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Subtasks</h2>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subtask</span>
                </Button>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>
                    Progress: {completedSubtasks}/{totalSubtasks}
                  </span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={`p-3 rounded-md border ${
                      subtask.completed ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleSubtask(subtask.id)}
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${
                          subtask.completed
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-gray-300 text-transparent"
                        }`}
                      >
                        {subtask.completed && <Check className="w-3 h-3" />}
                      </button>
                      <div className="flex-1">
                        <h3
                          className={`text-sm font-medium ${
                            subtask.completed ? "text-gray-500 line-through" : "text-gray-900"
                          }`}
                        >
                          {subtask.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{subtask.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{subtask.assignee}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(subtask.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-500">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>

              <div className="space-y-6 mb-6">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        <Image
                          src={comment.avatar}
                          alt={comment.author}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{comment.author}</span>
                          <span className="text-xs text-gray-500">
                            {comment.createdAt.toLocaleDateString()} at{" "}
                            {comment.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-gray-700">{comment.content}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button onClick={handleAddComment} className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Add Comment</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">John Doe</span> <span className="text-gray-500">changed status to</span>{" "}
                      <span className="font-medium">Doing</span>
                    </p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Sarah Wilson</span>{" "}
                      <span className="text-gray-500">completed subtask</span>{" "}
                      <span className="font-medium">Research drag and drop libraries</span>
                    </p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Mike Johnson</span>{" "}
                      <span className="text-gray-500">added a comment</span>
                    </p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Tasks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Tasks</h2>
              <div className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-md">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Design drag and drop interface</h3>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Done</span>
                    <span className="text-xs text-gray-500">TASK-4</span>
                  </div>
                </div>
                <div className="p-3 border border-gray-200 rounded-md">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Write documentation for drag and drop</h3>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Todo</span>
                    <span className="text-xs text-gray-500">TASK-6</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
