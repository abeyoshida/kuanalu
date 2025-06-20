'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateOrganization, deleteOrganization } from "@/lib/actions/organization-actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Trash2, Settings, Users, Bell } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

interface OrganizationSettingsProps {
  organization: {
    id: number;
    name: string;
    description?: string;
  };
}

export function OrganizationSettings({ organization }: OrganizationSettingsProps) {
  const [name, setName] = useState(organization.name);
  const [description, setDescription] = useState(organization.description || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskAssignmentNotifications, setTaskAssignmentNotifications] = useState(true);
  const [taskUpdateNotifications, setTaskUpdateNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [memberJoinNotifications, setMemberJoinNotifications] = useState(true);

  // Appearance settings
  const [primaryColor, setPrimaryColor] = useState("#0284c7"); // Default color

  const handleUpdateOrganization = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      
      // In a real app, we would also save these settings
      // formData.append("emailNotifications", emailNotifications.toString());
      // formData.append("primaryColor", primaryColor);
      
      await updateOrganization(organization.id, formData);
      
      toast({
        title: "Organization updated",
        description: "The organization has been updated successfully.",
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update organization");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrganization = async () => {
    setIsDeleting(true);

    try {
      await deleteOrganization(organization.id);
      // Will redirect to organizations page
    } catch (error) {
      setIsDeleting(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete organization",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update your organization's basic information
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateOrganization}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter organization name"
                    disabled={isUpdating}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter organization description"
                    disabled={isUpdating}
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    Brief description of your organization's purpose and goals.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button" disabled={isDeleting}>
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete Organization
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        organization and all associated projects and tasks.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteOrganization}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button type="submit" disabled={isUpdating || !name.trim()}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Notification Types</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="task-assignment">Task Assignments</Label>
                    <p className="text-sm text-muted-foreground">
                      When tasks are assigned to you
                    </p>
                  </div>
                  <Switch
                    id="task-assignment"
                    checked={taskAssignmentNotifications}
                    onCheckedChange={setTaskAssignmentNotifications}
                    disabled={!emailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="task-updates">Task Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      When tasks you're assigned to are updated
                    </p>
                  </div>
                  <Switch
                    id="task-updates"
                    checked={taskUpdateNotifications}
                    onCheckedChange={setTaskUpdateNotifications}
                    disabled={!emailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="comments">Comments</Label>
                    <p className="text-sm text-muted-foreground">
                      When someone comments on your tasks
                    </p>
                  </div>
                  <Switch
                    id="comments"
                    checked={commentNotifications}
                    onCheckedChange={setCommentNotifications}
                    disabled={!emailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="member-joins">Member Joins</Label>
                    <p className="text-sm text-muted-foreground">
                      When new members join the organization
                    </p>
                  </div>
                  <Switch
                    id="member-joins"
                    checked={memberJoinNotifications}
                    onCheckedChange={setMemberJoinNotifications}
                    disabled={!emailNotifications}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => {
                  toast({
                    title: "Notification settings saved",
                    description: "Your notification preferences have been updated.",
                  });
                }}
              >
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how your organization looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10"
                  />
                  <span className="text-sm text-muted-foreground">
                    {primaryColor.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose a primary color for your organization's branding.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-4 border rounded-md">
                  <div 
                    className="h-12 rounded-md mb-2" 
                    style={{ backgroundColor: primaryColor }}
                  ></div>
                  <div className="flex gap-2">
                    <Button style={{ backgroundColor: primaryColor }}>
                      Primary Button
                    </Button>
                    <Button variant="outline" style={{ borderColor: primaryColor, color: primaryColor }}>
                      Outline Button
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => {
                  toast({
                    title: "Appearance settings saved",
                    description: "Your appearance preferences have been updated.",
                  });
                }}
              >
                Save Appearance Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 