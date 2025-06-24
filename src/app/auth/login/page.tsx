import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-xl font-bold text-primary">FlowBoard</span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              {/* Navigation items */}
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Sign in</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Sign up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">          
          <LoginForm callbackUrl={callbackUrl} registered={registered} />
        </div>
      </div>
    </div>
  );
} 