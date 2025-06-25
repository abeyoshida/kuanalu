import { auth } from "@/lib/auth/auth";
import AppLayout from "@/components/dashboard/client-dashboard-layout";

interface ProjectsLayoutProps {
  children: React.ReactNode;
}

export default async function ProjectsLayout({
  children,
}: ProjectsLayoutProps) {
  const session = await auth();
  const userName = session?.user?.name || "User";

  // We'll let the project-specific layout handle its own title
  // This layout will only be used for the main projects listing page
  return (
    <AppLayout userName={userName} title="Projects">
      {children}
    </AppLayout>
  );
} 