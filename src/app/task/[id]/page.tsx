"use client"

import { useState } from "react"
import TaskDetail from "@/components/task-detail"
import ProjectSidebar from "@/components/project-sidebar"
import { useParams } from "next/navigation"

export default function TaskDetailPage() {
  const params = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ProjectSidebar isOpen={sidebarOpen} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <TaskDetail _taskId={params.id as string} toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      </div>
    </div>
  )
}
