"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Settings, BarChart3, Plus, ChevronRight, ChevronDown, Building } from "lucide-react"
import Image from "next/image"
import { getUserOrganizations } from "@/lib/actions/organization-actions"
import { getOrganizationProjects } from "@/lib/actions/project-actions"
import { getCurrentUser } from "@/lib/actions/user-actions"
import type { OrganizationWithMeta } from "@/types/organization"
import type { ProjectWithMeta } from "@/types/project"
import type { SafeUser } from "@/types/user"

// Define project colors based on status
const projectStatusColors: Record<string, string> = {
  planning: "bg-blue-500",
  active: "bg-green-500",
  on_hold: "bg-yellow-500",
  completed: "bg-purple-500",
  canceled: "bg-gray-500",
}

interface ProjectSidebarProps {
  isOpen: boolean
}

export default function ProjectSidebar({ isOpen }: ProjectSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    organizations: true,
  })
  const [user, setUser] = useState<SafeUser | null>(null)
  const [organizations, setOrganizations] = useState<OrganizationWithMeta[]>([])
  const [organizationProjects, setOrganizationProjects] = useState<Record<number, ProjectWithMeta[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Fetch current user
        const userData = await getCurrentUser()
        setUser(userData)
        
        // Fetch user's organizations
        const orgs = await getUserOrganizations()
        setOrganizations(orgs)
        
        // Fetch projects for each organization
        const projectsMap: Record<number, ProjectWithMeta[]> = {}
        
        for (const org of orgs) {
          const projects = await getOrganizationProjects(org.id)
          projectsMap[org.id] = projects
        }
        
        setOrganizationProjects(projectsMap)
        setError(null)
      } catch (err) {
        console.error("Error fetching sidebar data:", err)
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const toggleOrganization = (orgId: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [`org_${orgId}`]: !prev[`org_${orgId}`],
    }))
  }

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
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/organizations"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Building className="w-4 h-4" />
              Organizations
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </nav>

          {/* Organizations and Projects */}
          <div className="px-4 py-2">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            ) : error ? (
              <div className="text-sm text-red-500 p-2">{error}</div>
            ) : (
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div key={org.id} className="space-y-1">
                    <button
                      onClick={() => toggleOrganization(org.id)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>{org.name}</span>
                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                          {org.userRole}
                        </span>
                      </div>
                      {expandedSections[`org_${org.id}`] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {expandedSections[`org_${org.id}`] && (
                      <div className="ml-6 space-y-1">
                        {organizationProjects[org.id]?.length > 0 ? (
                          organizationProjects[org.id].map((project) => (
                            <Link
                              key={project.id}
                              href={`/projects/${project.id}`}
                              className="block px-3 py-2 text-sm hover:bg-gray-100 rounded-md group"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${projectStatusColors[project.status] || "bg-gray-400"}`}></div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 truncate">{project.name}</span>
                                    {project.archivedAt && (
                                      <span className="text-xs text-gray-400">Archived</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="text-xs text-gray-500 px-3 py-2">No projects</div>
                        )}

                        {/* Create New Project */}
                        <Link
                          href={`/organizations/${org.id}`}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create project</span>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}

                {organizations.length === 0 && (
                  <div className="text-sm text-gray-500 p-2">
                    No organizations found. 
                    <Link href="/organizations" className="text-blue-500 hover:underline ml-1">
                      Create one
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <Image
              src={user?.image || "/placeholder.svg"}
              alt="User avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "Loading..."}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
