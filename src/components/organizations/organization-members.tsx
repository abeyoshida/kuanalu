'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrganizationMembers } from "@/lib/actions/organization-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserRole } from "@/lib/auth/permissions";
import { RoleManager } from "@/components/auth/role-manager";
import { UserPlus } from "lucide-react";
import { InviteUserDialog } from "@/components/organizations/invite-user-dialog";

// Define the Role type
type Role = 'owner' | 'admin' | 'member' | 'guest';

interface OrganizationMembersProps {
  organizationId: number;
  currentUserId: number;
}

interface Member {
  userId: number;
  name: string;
  email: string;
  image: string | null;
  role: string;
  joinedAt: Date;
}

export function OrganizationMembers({ organizationId, currentUserId }: OrganizationMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const membersList = await getOrganizationMembers(organizationId);
        setMembers(membersList);
        
        // Find current user's role
        const userRole = await getUserRole(currentUserId, organizationId);
        setCurrentUserRole(userRole);
      } catch (error) {
        setError("Failed to load organization members");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMembers();
  }, [organizationId, currentUserId]);
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  // Check if current user can invite users
  const canInviteUsers = currentUserRole === 'owner' || currentUserRole === 'admin';
  
  if (loading) {
    return <div className="text-center py-8">Loading members...</div>;
  }
  
  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Organization Members</CardTitle>
            <CardDescription>
              Manage members and their roles in this organization
            </CardDescription>
          </div>
          {canInviteUsers && (
            <InviteUserDialog>
              <Button size="sm" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invite User
              </Button>
            </InviteUserDialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No members found in this organization.
              </div>
            ) : (
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {members.map((member) => (
                      <tr key={member.userId} className="hover:bg-muted/50">
                        <td className="p-3 flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.image || ""} alt={member.name} />
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.name}</span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {member.email}
                        </td>
                        <td className="p-3">
                          {currentUserRole && (
                            <RoleManager
                              userId={member.userId}
                              organizationId={organizationId}
                              currentRole={member.role as Role}
                              userName={member.name}
                              currentUserRole={currentUserRole as Role}
                              currentUserId={currentUserId}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 