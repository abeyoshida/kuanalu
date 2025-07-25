import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <div className="flex w-full gap-8 items-center justify-center">
        {/* Left Column - Register Form (30% width) */}
        <div className="w-[30%] flex items-center justify-center">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  Create an account
                </CardTitle>
                <CardDescription>
                  Enter your information to create an account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading...</div>}>
                  <RegisterForm />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Marketing Content (25% width) */}
        <div className="w-[25%] flex items-center justify-center">
          <div className="w-full space-y-6 text-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-gray-900">
                Manage your projects all at once
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Register yourself and your organization together to use FlowBoardAI. Then add team members after you login.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 