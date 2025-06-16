'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { hasPermission } from '@/lib/auth/permissions';

interface WithPermissionProps {
  organizationId: number;
  userId: number;
  action: string;
  subject: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function WithPermission({
  organizationId,
  userId,
  action,
  subject,
  fallback = null,
  children
}: WithPermissionProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const permitted = await hasPermission(userId, organizationId, action, subject);
        setHasAccess(permitted);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasAccess(false);
      }
    };

    checkPermission();
  }, [userId, organizationId, action, subject]);

  if (hasAccess === null) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
}

export function withPermissionCheck<P extends object>(
  Component: React.ComponentType<P>,
  action: string,
  subject: string
) {
  return function PermissionCheckedComponent(
    props: P & { organizationId: number; userId: number }
  ) {
    return (
      <WithPermission
        organizationId={props.organizationId}
        userId={props.userId}
        action={action}
        subject={subject}
        fallback={
          <div className="p-4 text-center">
            <p className="text-red-500">You don&apos;t have permission to access this resource.</p>
          </div>
        }
      >
        <Component {...props} />
      </WithPermission>
    );
  };
} 