import { Suspense } from "react"
import TaskDetailClient from "./task-detail-client"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { Metadata } from "next"

// This function is used to generate metadata for the page
export async function generateMetadata(): Promise<Metadata> {
  // Use a generic title that doesn't access params.id
  return {
    title: "Task Details | FlowBoard",
    description: "View and manage task details",
  };
}

// Define the page component without accessing params.id directly
export default async function TaskDetailPage() {
  // Check if the user is authenticated
  const session = await auth();
  
  // If not authenticated, redirect to login
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  // We'll get the ID from the URL in the client component
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Loading task details...</div>}>
      <TaskDetailClient />
    </Suspense>
  );
} 