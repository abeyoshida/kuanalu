'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Role } from '@/lib/auth/permissions-data';
import { roleHasPermission, roleHasMultiplePermissions, roleHasAnyPermission } from '@/lib/auth/client-permissions';

interface WithPermissionProps {
  children: ReactNode;
  userRole: Role;
  action: string;
  subject: string;
  fallback?: ReactNode;
}

interface WithMultiplePermissionsProps {
  children: ReactNode;
  userRole: Role;
  permissions: Array<{ action: string; subject: string }>;
  type?: 'all' | 'any';
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function WithPermission({
  children,
  userRole,
  action,
  subject,
  fallback = null
}: WithPermissionProps) {
  const hasPermission = roleHasPermission(userRole, action, subject);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component that conditionally renders children based on multiple user permissions
 */
export function WithMultiplePermissions({
  children,
  userRole,
  permissions,
  type = 'all',
  fallback = null
}: WithMultiplePermissionsProps) {
  const hasPermission = type === 'all' 
    ? roleHasMultiplePermissions(userRole, permissions)
    : roleHasAnyPermission(userRole, permissions);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

interface WithAsyncPermissionProps {
  children: ReactNode;
  userId: number;
  organizationId: number;
  action: string;
  subject: string;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

interface WithAsyncMultiplePermissionsProps {
  children: ReactNode;
  userId: number;
  organizationId: number;
  permissions: Array<{ action: string; subject: string }>;
  type?: 'all' | 'any';
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on async permission check
 */
export function WithAsyncPermission({
  children,
  userId,
  organizationId,
  action,
  subject,
  fallback = null,
  loadingFallback = null
}: WithAsyncPermissionProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await fetch('/api/auth/check-permission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            organizationId,
            action,
            subject
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasPermission(data.hasPermission);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      }
    };
    
    checkPermission();
  }, [userId, organizationId, action, subject]);
  
  if (hasPermission === null) {
    return <>{loadingFallback}</>;
  }
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component that conditionally renders children based on async multiple permission checks
 */
export function WithAsyncMultiplePermissions({
  children,
  userId,
  organizationId,
  permissions,
  type = 'all',
  fallback = null,
  loadingFallback = null
}: WithAsyncMultiplePermissionsProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const response = await fetch('/api/auth/check-permission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            organizationId,
            permissions,
            type: type === 'all' ? 'multiple' : 'any'
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasPermission(data.hasPermission);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      }
    };
    
    checkPermissions();
  }, [userId, organizationId, permissions, type]);
  
  if (hasPermission === null) {
    return <>{loadingFallback}</>;
  }
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
} 