import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateProjectMemberRole } from "@/lib/actions/role-actions";
import { roleEnum } from "@/lib/db/schema";
import { useToast } from "@/hooks/use-toast";

interface ProjectMember {
  userId: number;
  projectId: number;
  role: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ProjectRoleManagerProps {
  projectId: number;
  members: ProjectMember[];
  currentUserRole: string;
  currentUserId: number;
  onRoleUpdated?: () => void;
}

export default function ProjectRoleManager({ 
  projectId,
  members, 
  currentUserRole, 
  currentUserId,
  onRoleUpdated 
}: ProjectRoleManagerProps) {
  const [roles, setRoles] = useState<{ [key: number]: string }>({}); 
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  const { toast } = useToast();

  // Initialize roles from members
  useEffect(() => {
    const initialRoles = members.reduce((acc, member) => {
      acc[member.userId] = member.role;
      return acc;
    }, {} as { [key: number]: string });
    
    setRoles(initialRoles);
  }, [members]);

  // Function to check if the current user can edit roles
  const canEditRoles = () => {
    return ['owner', 'admin'].includes(currentUserRole);
  };

  // Function to check if a specific member's role can be edited
  const canEditMemberRole = (member: ProjectMember) => {
    // Cannot edit your own role
    if (member.userId === currentUserId) {
      return false;
    }
    
    // Owners can edit anyone
    if (currentUserRole === 'owner') {
      return true;
    }
    
    // Admins can edit members and guests, but not owners or other admins
    if (currentUserRole === 'admin') {
      return ['member', 'guest'].includes(member.role);
    }
    
    return false;
  };

  // Handle role change
  const handleRoleChange = async (userId: number, newRole: string) => {
    setLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const result = await updateProjectMemberRole(projectId, userId, newRole);
      
      if (result.success) {
        setRoles(prev => ({ ...prev, [userId]: newRole }));
        toast({
          title: "Role updated",
          description: "The member's role has been updated successfully.",
        });
        
        if (onRoleUpdated) {
          onRoleUpdated();
        }
      } else {
        toast({
          title: "Error updating role",
          description: result.error || "An error occurred while updating the role.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error updating role",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Handle removing a member
  const handleRemoveMember = async (userId: number) => {
    setLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      // Implementation for removing a member would go here
      // For now, just show a toast
      toast({
        title: "Not implemented",
        description: "Member removal functionality is not yet implemented.",
      });
    } catch {
      toast({
        title: "Error removing member",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.length === 0 ? (
            <p className="text-sm text-gray-500">No members found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={roles[member.userId] || member.role}
                      onValueChange={(value) => handleRoleChange(member.userId, value)}
                      disabled={!canEditRoles() || !canEditMemberRole(member) || loading[member.userId]}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(roleEnum.enumValues).map((role) => (
                          <SelectItem key={role} value={role} disabled={role === 'owner'}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {canEditMemberRole(member) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={loading[member.userId]}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
