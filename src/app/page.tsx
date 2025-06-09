"use client"

import { useState } from "react"
import KanbanBoard from "@/components/kanban-board"
import ProjectSidebar from "@/components/project-sidebar"
import { Menu, X } from "lucide-react"

export default function HomePage() {
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
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
                <span className="text-gray-500">/</span>
                <h2 className="text-lg text-gray-700">Project Board</h2>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Filter
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Create Task
                </button>
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Toggle sidebar"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="px-6 py-8">
          <KanbanBoard />
        </main>
      </div>
    </div>
  )
}
