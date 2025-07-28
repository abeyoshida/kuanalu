"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, CheckCircle, Clock, Building, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUserOrganizations } from "@/lib/actions/organization-actions";
import { getDashboardStats, DashboardStats } from "@/lib/actions/dashboard-actions";

export default function DashboardContent() {
  const [error, setError] = useState<Error | null>(null);
  const [hasOrganizations, setHasOrganizations] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  
  // Check if user has any organizations and load dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const orgs = await getUserOrganizations();
        setHasOrganizations(orgs.length > 0);
        
        if (orgs.length > 0) {
          const stats = await getDashboardStats();
          setDashboardData(stats);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);
  
  // Add error boundary
  useEffect(() => {
    // Reset error state when component mounts
    setError(null);
  }, []);

  // If there was an error, show a simple error message
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
        <p className="text-sm text-red-600">
          We encountered an error loading your dashboard. Please try refreshing the page.
        </p>
        <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
          {error.message}
        </pre>
      </div>
    );
  }
  
  // If loading, show skeleton layout
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Recent Activity skeleton */}
          <Card className="col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-b pb-2 last:border-b-0">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Upcoming Deadlines skeleton */}
          <Card className="col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-b pb-2 last:border-b-0">
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // If user has no organizations, show onboarding
  if (hasOrganizations === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Building className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to FlowBoardAI</h2>
        <p className="text-gray-600 mb-6">
          Get started by creating your first organization to manage projects and tasks.
        </p>
        <Link href="/organizations">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </Link>
      </div>
    );
  }

  // Helper function to format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  };

  // Helper function to format due date
  const formatDueDate = (daysUntilDue: number) => {
    if (daysUntilDue === 0) return "Due today";
    if (daysUntilDue === 1) return "Due tomorrow";
    if (daysUntilDue < 7) return `Due in ${daysUntilDue} days`;
    return `Due in ${Math.ceil(daysUntilDue / 7)} week${daysUntilDue >= 14 ? 's' : ''}`;
  };

  try {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalProjects || 0}</div>
              <p className="text-xs text-gray-500">Across your organizations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.completedTasks || 0}</div>
              <p className="text-xs text-gray-500">Tasks marked as done</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.pendingTasks || 0}</div>
              <p className="text-xs text-gray-500">Tasks in progress</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="border-b pb-2 last:border-b-0">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatTimeAgo(activity.timestamp)} by {activity.userDisplayName}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs">Start working on tasks to see activity here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.upcomingDeadlines && dashboardData.upcomingDeadlines.length > 0 ? (
                  dashboardData.upcomingDeadlines.map((deadline) => (
                    <div key={deadline.id} className="border-b pb-2 last:border-b-0">
                      <p className="font-medium">{deadline.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatDueDate(deadline.daysUntilDue)} • {deadline.projectName}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming deadlines</p>
                    <p className="text-xs">Tasks with due dates will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    setError(error);
    return null;
  }
} 