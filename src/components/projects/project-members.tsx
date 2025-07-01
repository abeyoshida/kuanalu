import { useState, useEffect } from "react";
import { getProjectMembers } from "@/lib/actions/project-actions";
import ProjectRoleManager from "@/components/auth/project-role-manager";
import AddProjectMemberDialog from "./add-project-member-dialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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

interface ProjectMembersProps {
  projectId: number;
  organizationId: number;
  currentUserRole: string;
  currentUserId: number;
}

export default function ProjectMembers({ 
  projectId, 
  organizationId, 
  currentUserRole, 
  currentUserId 
}: ProjectMembersProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const result = await getProjectMembers(projectId);
      if (result.success) {
        setMembers(result.data || []);
      } else {
        toast({
          title: "Error fetching members",
          description: result.error || "Failed to load project members",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const canManageMembers = ['owner', 'admin'].includes(currentUserRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Project Members</h2>
        {canManageMembers && (
          <AddProjectMemberDialog 
            projectId={projectId}
            organizationId={organizationId}
            onMemberAdded={fetchMembers}
          >
            <Button>Add Member</Button>
          </AddProjectMemberDialog>
        )}
      </div>
      
      {loading ? (
        <div className="p-6 border rounded-md">
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-500">Loading members...</p>
          </div>
        </div>
      ) : (
        <ProjectRoleManager
          projectId={projectId}
          members={members}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          onRoleUpdated={fetchMembers}
        />
      )}
    </div>
  );
}
