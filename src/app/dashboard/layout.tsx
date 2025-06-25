import AppLayout from "@/components/dashboard/client-dashboard-layout";
import { auth } from "@/lib/auth/auth";

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