'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getUserPendingInvitations, acceptInvitation } from "@/lib/actions/invitation-actions";
import { toast } from "@/hooks/use-toast";

interface Invitation {
  id: number;
  token: string;
  organizationId: number;
  organizationName: string;
  inviterName: string;
  role: "owner" | "admin" | "member" | "guest";
  invitedBy: number;
  createdAt: Date;
  expiresAt: Date;
}

export function PendingInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingInvitation, setAcceptingInvitation] = useState<number | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const data = await getUserPendingInvitations();
      setInvitations(data);
    } catch (error) {
      console.error("Failed to load invitations:", error);
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (token: string, invitationId: number) => {
    try {
      setAcceptingInvitation(invitationId);
      await acceptInvitation(token);
      
      toast({
        title: "Success",
        description: "Invitation accepted successfully!",
      });
      
      // Remove the accepted invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      toast({
        title: "Error", 
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAcceptingInvitation(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>
          You have been invited to join these organizations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="font-medium">{invitation.organizationName}</div>
                  <div className="text-sm text-muted-foreground">
                    Invited by {invitation.inviterName} on{" "}
                    {format(new Date(invitation.createdAt), "MMM d, yyyy")}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {invitation.role}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    disabled={acceptingInvitation !== null}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvitation(invitation.token, invitation.id)}
                    disabled={acceptingInvitation !== null}
                  >
                    {acceptingInvitation === invitation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 