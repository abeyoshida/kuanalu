"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle, Clock, Building, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUserOrganizations } from "@/lib/actions/organization-actions";

export default function DashboardContent() {
  const [error, setError] = useState<Error | null>(null);
  const [hasOrganizations, setHasOrganizations] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if user has any organizations
  useEffect(() => {
    async function checkOrganizations() {
      try {
        setLoading(true);
        const orgs = await getUserOrganizations();
        setHasOrganizations(orgs.length > 0);
      } catch (err) {
        console.error("Error checking organizations:", err);
        setError(err instanceof Error ? err : new Error('Failed to check organizations'));
      } finally {
        setLoading(false);
      }
    }
    
    checkOrganizations();
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
  
  // If loading, show a loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
          <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
          <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
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
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-gray-500">+2 from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">64</div>
              <p className="text-xs text-gray-500">+12 from last week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-gray-500">-5 from last week</p>
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
                <div className="border-b pb-2">
                  <p className="font-medium">Task &quot;Homepage redesign&quot; was completed</p>
                  <p className="text-sm text-gray-500">2 hours ago by John Doe</p>
                </div>
                <div className="border-b pb-2">
                  <p className="font-medium">New task &quot;API Integration&quot; was created</p>
                  <p className="text-sm text-gray-500">Yesterday by Jane Smith</p>
                </div>
                <div className="border-b pb-2">
                  <p className="font-medium">Project &quot;Mobile App&quot; status changed to &quot;In Progress&quot;</p>
                  <p className="text-sm text-gray-500">2 days ago by Mike Johnson</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <p className="font-medium">Database Migration</p>
                  <p className="text-sm text-gray-500">Due in 2 days</p>
                </div>
                <div className="border-b pb-2">
                  <p className="font-medium">User Testing</p>
                  <p className="text-sm text-gray-500">Due in 5 days</p>
                </div>
                <div className="border-b pb-2">
                  <p className="font-medium">Final Presentation</p>
                  <p className="text-sm text-gray-500">Due in 1 week</p>
                </div>
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