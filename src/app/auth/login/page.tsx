import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: {
    callbackUrl?: string;
    registered?: string;
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Check if user is already logged in
  const session = await auth();
  
  // Extract callbackUrl from searchParams - properly awaited
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl || "/dashboard";
  const registered = params?.registered === "true";
  
  if (session?.user) {
    redirect(callbackUrl);
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        
        <LoginForm callbackUrl={callbackUrl} registered={registered} />
      </div>
    </div>
  );
} 