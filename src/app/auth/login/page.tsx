import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Login | Kuanalu',
  description: 'Login to your account',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; registered?: string; email?: string };
}) {
  const session = await auth();
  
  // If user is already authenticated, redirect to callbackUrl
  if (session?.user) {
    redirect(searchParams.callbackUrl || '/dashboard');
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to sign in to your account
        </p>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
} 