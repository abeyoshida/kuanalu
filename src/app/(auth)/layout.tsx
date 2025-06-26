import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import AppShell from "@/components/layout/app-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kuanalu - Dashboard",
  description: "Project and task management dashboard",
};

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the session
  const session = await auth();
  
  // If no session, redirect to login
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  const userName = session.user.name || "User";

  return (
    <SidebarProvider>
      <AppShell userName={userName}>
        {children}
      </AppShell>
    </SidebarProvider>
  );
} 