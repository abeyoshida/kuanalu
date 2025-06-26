import { auth } from "@/lib/auth/auth";

export default async function ProjectsPage() {
  await auth();

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
      {/* Projects list would go here */}
      <div className="text-gray-500">
        Select a project from the sidebar to view its tasks.
      </div>
    </div>
  );
} 