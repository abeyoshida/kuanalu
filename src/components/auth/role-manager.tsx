'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@/lib/auth/permissions';
import { updateUserRole, removeUserFromOrganization } from '@/lib/actions/role-actions';
import { Loader2, ChevronDown, Shield, ShieldAlert, ShieldCheck, User, UserX } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RoleManagerProps {
  userId: number;
  organizationId: number;
  currentRole: Role;
  userName: string;
  currentUserRole: Role;
  currentUserId: number;
}

export function RoleManager({
  userId,
  organizationId,
  currentRole,
  userName,
  currentUserRole,
  currentUserId,
}: RoleManagerProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  
  // Check if current user can update roles
  const canUpdateRoles = 
    currentUserRole === 'owner' || 
    (currentUserRole === 'admin' && currentRole !== 'owner');
  
  // Check if current user can remove users
  const canRemoveUsers = 
    currentUserRole === 'owner' || 
    (currentUserRole === 'admin' && currentRole !== 'owner');
  
  // Prevent updating or removing self
  const isSelf = userId === currentUserId;
  
  const roleIcons = {
    owner: <ShieldAlert className="h-4 w-4 text-purple-500" />,
    admin: <ShieldCheck className="h-4 w-4 text-blue-500" />,
    member: <Shield className="h-4 w-4 text-green-500" />,
    guest: <User className="h-4 w-4 text-gray-500" />,
  };
  
  const roleLabels = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    guest: 'Guest',
  };
  
  const handleRoleChange = async (newRole: Role) => {
    if (newRole === currentRole) return;
    
    setIsUpdating(true);
    
    try {
      const result = await updateUserRole(userId, organizationId, newRole);
      
      if (result.success) {
        toast({
          title: 'Role updated',
          description: `${userName}'s role has been updated to ${roleLabels[newRole]}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to update role',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while updating the role.',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleRemoveUser = async () => {
    setIsRemoving(true);
    
    try {
      const result = await removeUserFromOrganization(userId, organizationId);
      
      if (result.success) {
        toast({
          title: 'User removed',
          description: `${userName} has been removed from the organization.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to remove user',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while removing the user.',
      });
    } finally {
      setIsRemoving(false);
      setShowRemoveDialog(false);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {roleIcons[currentRole]}
        <span className="text-sm font-medium">{roleLabels[currentRole]}</span>
      </div>
      
      {canUpdateRoles && !isSelf && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isUpdating}>
            <Button variant="outline" size="sm" className="h-8 px-2">
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {currentUserRole === 'owner' && (
              <DropdownMenuItem onClick={() => handleRoleChange('owner')}>
                <div className="flex items-center gap-2">
                  {roleIcons.owner}
                  <span>Owner</span>
                </div>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleRoleChange('admin')}>
              <div className="flex items-center gap-2">
                {roleIcons.admin}
                <span>Admin</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleChange('member')}>
              <div className="flex items-center gap-2">
                {roleIcons.member}
                <span>Member</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleChange('guest')}>
              <div className="flex items-center gap-2">
                {roleIcons.guest}
                <span>Guest</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {canRemoveUsers && !isSelf && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => setShowRemoveDialog(true)}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserX className="h-4 w-4" />
            )}
          </Button>
          
          <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove user from organization</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove {userName} from this organization? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveUser} className="bg-red-500 hover:bg-red-600">
                  {isRemoving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserX className="h-4 w-4 mr-2" />
                  )}
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
} 