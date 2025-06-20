import { auth } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogOut, User, Building } from "lucide-react";
import { PendingInvitations } from "@/components/organizations/pending-invitations";

export default async function DashboardPage() {
  const session = await auth();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            Welcome, <span className="font-medium">{session?.user?.name || "User"}</span>
          </div>
          <Link href="/profile">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </Button>
          </Link>
          <Link href="/auth/logout">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Pending Invitations */}
      <div className="mb-8">
        <PendingInvitations />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">My Organizations</h2>
          <p className="text-gray-600 mb-4">
            Manage your organizations and teams
          </p>
          <Link href="/organizations">
            <Button className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              View Organizations
            </Button>
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">My Projects</h2>
          <p className="text-gray-600 mb-4">
            View and manage your projects
          </p>
          <Link href="/projects">
            <Button>View Projects</Button>
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
          <p className="text-gray-600 mb-4">
            View tasks assigned to you
          </p>
          <Button>View Tasks</Button>
        </div>
      </div>
    </div>
  );
} 