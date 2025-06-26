import { auth } from "@/lib/auth/auth";
import AppLayout from "@/components/dashboard/client-dashboard-layout";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userName = session?.user?.name || "User";

  return (
    <AppLayout userName={userName} title="Profile">
      {children}
    </AppLayout>
  );
} 