"use client";

import KanbanBoard from "@/components/kanban-board";

export default function ClientDashboard() {
  return (
    <div className="space-y-6">
      {/* Header for the kanban board */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-medium">My Tasks</h2>
          <div className="text-sm text-gray-500">
            Drag and drop tasks to update their status
          </div>
        </div>
        <p className="text-gray-600 text-sm">
          View and manage your tasks across all projects
        </p>
      </div>
      
      {/* Kanban board */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <KanbanBoard />
      </div>
    </div>
  );
} 