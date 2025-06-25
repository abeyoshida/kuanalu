import { auth } from "@/lib/auth/auth";
import AppLayout from "@/components/dashboard/client-dashboard-layout";

export default async function ProjectsPage() {
  const session = await auth();
  const userName = session?.user?.name || "User";

  return (
    <AppLayout userName={userName} title="Projects">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
        {/* Projects list would go here */}
        <div className="text-gray-500">
          Select a project from the sidebar to view its tasks.
        </div>
      </div>
    </AppLayout>
  );
} 