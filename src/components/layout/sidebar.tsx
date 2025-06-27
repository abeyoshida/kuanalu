"use client"

import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { Settings, BarChart3, Plus, Building, ChevronDown } from "lucide-react"
import { getUserOrganizations } from "@/lib/actions/organization-actions"
import { getOrganizationProjects } from "@/lib/actions/project-actions"
import { getCurrentUser } from "@/lib/actions/user-actions"
import type { OrganizationWithMeta } from "@/types/organization"
import type { ProjectWithMeta } from "@/types/project"
import type { SafeUser } from "@/types/user"
import { usePathname } from "next/navigation"
import { CreateProjectDialog } from "@/components/organizations/create-project-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"

// Define project colors based on status
const projectStatusColors: Record<string, string> = {
  planning: "bg-blue-500",
  active: "bg-green-500",
  on_hold: "bg-yellow-500",
  completed: "bg-purple-500",
  canceled: "bg-gray-500",
}

interface SidebarProps {
  isOpen: boolean
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const [user, setUser] = useState<SafeUser | null>(null)
  const [organizations, setOrganizations] = useState<OrganizationWithMeta[]>([])
  const [organizationProjects, setOrganizationProjects] = useState<Record<number, ProjectWithMeta[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)
  const pathname = usePathname()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch current user
      const userData = await getCurrentUser()
      setUser(userData)
      
      // Fetch user's organizations
      const orgs = await getUserOrganizations()
      setOrganizations(orgs)
      
      // Set the first organization as selected by default if there is one
      if (orgs.length > 0 && !selectedOrgId) {
        setSelectedOrgId(orgs[0].id)
      }
      
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
  }, [selectedOrgId])

  // Function to refresh projects for a specific organization
  const refreshProjects = useCallback(async (organizationId: number) => {
    try {
      const projects = await getOrganizationProjects(organizationId)
      setOrganizationProjects(prev => ({
        ...prev,
        [organizationId]: projects
      }))
    } catch (err) {
      console.error(`Error refreshing projects for organization ${organizationId}:`, err)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Get the selected organization
  const selectedOrg = organizations.find(org => org.id === selectedOrgId)
  
  // Get projects for the selected organization
  const selectedOrgProjects = selectedOrgId ? organizationProjects[selectedOrgId] || [] : []

  // Check if path is active (considering the route group structure)
  const isActivePath = (path: string) => {
    if (pathname === path) return true
    // For paths like /projects/123, we need to check if it starts with /projects/
    if (path !== '/' && pathname.startsWith(`${path}/`)) return true
    return false
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
              <span className="text-white font-bold text-sm">KB</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Kuanalu</h2>
              <p className="text-xs text-gray-500">Workspace</p>
            </div>
          </div>
        </div>

        {/* Organization Dropdown */}
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between font-normal"
                disabled={loading || organizations.length === 0}
              >
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span className="truncate">
                    {loading 
                      ? "Loading..." 
                      : selectedOrg 
                        ? selectedOrg.name 
                        : organizations.length === 0 
                          ? "No Organizations" 
                          : "Select Organization"}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
              {organizations.map((org) => (
                <DropdownMenuItem 
                  key={org.id} 
                  onClick={() => setSelectedOrgId(org.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{org.name}</span>
                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                      {org.userRole}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
              
              <Link href="/organizations">
                <DropdownMenuItem className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Create Organization</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md ${
                isActivePath("/dashboard") ? "bg-gray-100 text-gray-900" : ""
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href={selectedOrgId ? `/organizations/${selectedOrgId}/members` : "/organizations"}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md ${
                isActivePath("/organizations") && pathname.includes("/members") ? "bg-gray-100 text-gray-900" : ""
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Members
            </Link>
            <Link
              href="/profile"
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md ${
                isActivePath("/profile") ? "bg-gray-100 text-gray-900" : ""
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </nav>

          {/* Projects Section */}
          {selectedOrgId && (
            <div className="px-4 py-2">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">PROJECTS</h3>
                {selectedOrgId && (
                  <CreateProjectDialog organizationId={selectedOrgId} onProjectCreated={() => refreshProjects(selectedOrgId)}>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <span className="sr-only">Create project</span>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </CreateProjectDialog>
                )}
              </div>
              
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
                <div className="space-y-1">
                  {selectedOrgProjects.length > 0 ? (
                    selectedOrgProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className={`block px-2 py-1 text-sm hover:bg-gray-100 rounded-md group ${
                          isActivePath(`/projects/${project.id}`) ? "bg-gray-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${projectStatusColors[project.status] || "bg-gray-400"}`}></div>
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
                    <div className="text-xs text-gray-500 px-2 py-1">No projects</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Section */}
        {user && (
          <div className="p-4 border-t border-gray-200">
            <Link href="/profile" className="flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded-md">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                {user.image ? (
                  <Image 
                    src={user.image} 
                    alt={user.name || ""} 
                    width={32} 
                    height={32} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <span className="text-gray-500 font-medium text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 