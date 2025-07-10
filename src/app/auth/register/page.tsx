import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Register | FlowBoardAI',
  description: 'Create a new account',
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; email?: string; invitationToken?: string };
}) {
  const session = await auth();
  
  // If user is already authenticated, redirect to callbackUrl
  if (session?.user) {
    redirect(searchParams.callbackUrl || '/dashboard');
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your information to create an account
        </p>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
} 