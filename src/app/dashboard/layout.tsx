import { Button } from "@/components/ui/button";
import { Menu, LogOut, User } from "lucide-react";
import ProjectSidebar from "@/components/project-sidebar";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import AppLayout from "@/components/dashboard/client-dashboard-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userName = session?.user?.name || "User";

  return (
    <AppLayout userName={userName} title="Dashboard">
      {children}
    </AppLayout>
  );
} 