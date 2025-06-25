import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ClientDashboard from "@/components/dashboard/client-dashboard";

export default async function DashboardPage() {
  // Get the session
  const session = await auth();
  
  // If no session, redirect to login
  if (!session?.user) {
    console.log("No session found, redirecting to login");
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientDashboard />
    </Suspense>
  );
} 