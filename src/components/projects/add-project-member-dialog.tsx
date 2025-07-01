import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roleEnum } from "@/lib/db/schema";
import { useToast } from "@/hooks/use-toast";
import { UserSearch } from "@/components/auth/user-search";

interface AddProjectMemberDialogProps {
  projectId: number;
  organizationId: number;
  onMemberAdded?: () => void;
  children?: React.ReactNode;
}

export default function AddProjectMemberDialog({ 
  projectId, 
  organizationId, 
  onMemberAdded, 
  children 
}: AddProjectMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user to add.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call API to add user to project
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: selectedUserId, 
          role: selectedRole 
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Member added",
          description: "The member has been added to the project successfully.",
        });
        
        setSelectedUserId(null);
        setSelectedRole("member");
        setOpen(false);
        
        if (onMemberAdded) {
          onMemberAdded();
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error adding member",
          description: errorData.error || "An error occurred while adding the member.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error adding member",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>Add Member</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Project Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">User</label>
            <UserSearch 
              organizationId={organizationId}
              onUserSelected={(userId: number) => setSelectedUserId(userId)}
              placeholder="Search for users..."
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(roleEnum.enumValues)
                  .filter(role => role !== 'owner') // Filter out owner role
                  .map(role => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!selectedUserId || isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
