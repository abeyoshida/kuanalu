import { RegisterForm } from "@/components/auth/register-form";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  // Check if user is already logged in
  const session = await auth();
  
  // Extract callbackUrl from searchParams safely
  // In Next.js 15, we need to use a different approach
  const callbackUrl = "/dashboard";
  
  if (session?.user) {
    redirect(callbackUrl);
  }
  
  return (
    <RegisterForm callbackUrl={callbackUrl} />
  );
} 