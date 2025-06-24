"use client"

import Link from "next/link"
import { useState } from "react"
import { Settings, Users, BarChart3, Plus, ChevronRight, ChevronDown } from "lucide-react"
import Image from "next/image"

interface Project {
  id: string
  name: string
  key: string
  description: string
  status: "active" | "archived" | "draft"
  tasksCount: number
  completedTasks: number
  color: string
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "E-commerce Platform",
    key: "ECP",
    description: "Main e-commerce application",
    status: "active",
    tasksCount: 24,
    completedTasks: 18,
    color: "bg-blue-500",
  },
  {
    id: "2",
    name: "Mobile App",
    key: "MOB",
    description: "iOS and Android mobile application",
    status: "active",
    tasksCount: 16,
    completedTasks: 8,
    color: "bg-green-500",
  },
  {
    id: "3",
    name: "Marketing Website",
    key: "MKT",
    description: "Company marketing and landing pages",
    status: "active",
    tasksCount: 12,
    completedTasks: 10,
    color: "bg-purple-500",
  },
  {
    id: "4",
    name: "API Documentation",
    key: "DOC",
    description: "Developer documentation portal",
    status: "draft",
    tasksCount: 8,
    completedTasks: 2,
    color: "bg-orange-500",
  },
  {
    id: "5",
    name: "Legacy Migration",
    key: "LEG",
    description: "Migration from old system",
    status: "archived",
    tasksCount: 45,
    completedTasks: 45,
    color: "bg-gray-500",
  },
]

interface ProjectSidebarProps {
  isOpen: boolean
}

export default function ProjectSidebar({ isOpen }: ProjectSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    projects: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  //const activeProjects = mockProjects.filter((p) => p.status === "active")

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-transform duration-300 z-40 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ width: "256px" }}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">FB</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">FlowBoard</h2>
              <p className="text-xs text-gray-500">Workspace</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Users className="w-4 h-4" />
              Team
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </nav>



          {/* All Projects */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => toggleSection("projects")}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <span>Projects</span>
                {expandedSections.projects ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {expandedSections.projects && (
              <div className="space-y-1">
                {mockProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/project/${project.id}`}
                    className="block px-3 py-2 text-sm hover:bg-gray-100 rounded-md group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${project.color}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{project.name}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {project.key}
                          </span>
                          {project.status === "archived" && <span className="text-xs text-gray-400">Archived</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Create New Project */}
                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Create project</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <Image
              src="/placeholder.svg"
              alt="User avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">john@company.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
