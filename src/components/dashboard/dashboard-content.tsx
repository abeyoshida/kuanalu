"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle, Clock } from "lucide-react";

export default function DashboardContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
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
                <p className="font-medium">Task "Homepage redesign" was completed</p>
                <p className="text-sm text-gray-500">2 hours ago by John Doe</p>
              </div>
              <div className="border-b pb-2">
                <p className="font-medium">New task "API Integration" was created</p>
                <p className="text-sm text-gray-500">Yesterday by Jane Smith</p>
              </div>
              <div className="border-b pb-2">
                <p className="font-medium">Project "Mobile App" status changed to "In Progress"</p>
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
} 