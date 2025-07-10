'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface PermissionErrorProps {
  title?: string;
  message?: string;
  resource?: string;
  action?: string;
  showBackButton?: boolean;
  backButtonLabel?: string;
  backButtonAction?: () => void;
  showHomeButton?: boolean;
}

export function PermissionError({
  title = 'Permission Denied',
  message,
  resource,
  action,
  showBackButton = true,
  backButtonLabel = 'Go Back',
  backButtonAction,
  showHomeButton = false,
}: PermissionErrorProps) {
  const router = useRouter();
  
  const defaultMessage = resource && action
    ? `You don&apos;t have permission to ${action} this ${resource}.`
    : 'You don&apos;t have permission to perform this action.';
  
  const handleBack = () => {
    if (backButtonAction) {
      backButtonAction();
    } else {
      router.back();
    }
  };
  
  const handleGoHome = () => {
    router.push('/dashboard');
  };
  
  return (
    <Card className="p-6 max-w-md mx-auto my-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-red-100 p-3">
          <ShieldAlert className="h-6 w-6 text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600">{message || defaultMessage}</p>
          
          <p className="text-sm text-gray-500 mt-2">
            If you believe this is a mistake, please contact your organization administrator.
          </p>
        </div>
        
        <div className="flex gap-3 mt-4">
          {showBackButton && (
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              {backButtonLabel}
            </Button>
          )}
          
          {showHomeButton && (
            <Button onClick={handleGoHome}>
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
} 