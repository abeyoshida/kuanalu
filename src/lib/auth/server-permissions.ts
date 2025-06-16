import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { hasPermission } from '@/lib/auth/permissions';

/**
 * Server component utility to check permissions
 * If the user doesn't have permission, redirects to the specified path
 */
export async function checkPermission(
  organizationId: number,
  action: string,
  subject: string,
  redirectPath: string = '/dashboard'
): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  const userId = parseInt(session.user.id);
  const permitted = await hasPermission(userId, organizationId, action, subject);
  
  if (!permitted) {
    redirect(redirectPath);
  }
  
  return true;
}

/**
 * Server component utility to check if the current user has the specified permission
 * Returns boolean without redirecting
 */
export async function userHasPermission(
  organizationId: number,
  action: string,
  subject: string
): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user) {
    return false;
  }
  
  const userId = parseInt(session.user.id);
  return await hasPermission(userId, organizationId, action, subject);
} 