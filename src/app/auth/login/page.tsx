import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  // Check if user is already logged in
  const session = await auth();
  
  // Extract values from searchParams safely
  // In Next.js 15, we need to use a different approach
  const callbackUrl = "/dashboard";
  const registered = false;
  
  // If user is already authenticated, redirect to callbackUrl
  if (session?.user) {
    redirect(callbackUrl);
  }
  
  return (
    <LoginForm callbackUrl={callbackUrl} registered={registered} />
  );
} 