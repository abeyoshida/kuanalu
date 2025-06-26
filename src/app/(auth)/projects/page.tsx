import { Suspense } from "react";
import ProjectContent from "@/components/projects/project-content";

export const metadata = {
  title: "Projects | Kuanalu",
  description: "Manage your projects",
};

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectContent />
    </Suspense>
  );
} 