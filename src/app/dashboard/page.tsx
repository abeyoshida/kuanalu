import { auth } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div>
            Welcome, {session?.user?.name || "User"}
          </div>
          <form action="/api/auth/signout" method="post">
            <Button type="submit" variant="outline">Sign Out</Button>
          </form>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-600">
            No recent activity
          </p>
        </div>
      </div>
    </div>
  );
} 