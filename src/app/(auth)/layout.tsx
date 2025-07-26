import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import AppShell from "@/components/layout/app-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FlowBoardAI - Dashboard",
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
  
  const user = {
    name: session.user.name || null,
    email: session.user.email || null,
    image: session.user.image || null,
  };

  return (
    <SidebarProvider>
      <AppShell user={user}>
        {children}
      </AppShell>
    </SidebarProvider>
  );
} 