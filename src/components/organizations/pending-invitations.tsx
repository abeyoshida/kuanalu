'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserPendingInvitations } from "@/lib/actions/invitation-actions";
import { Badge } from "../ui/badge";
import { format } from "date-fns";
import { Loader2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Invitation {
  id: number;
  token: string;
  organizationId: number;
  role: string;
  invitedBy: number;
  createdAt: Date;
  expiresAt: Date;
  organizationName: string;
  inviterName: string;
}

export function PendingInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingInvitation, setAcceptingInvitation] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const pendingInvitations = await getUserPendingInvitations();
        setInvitations(pendingInvitations || []);
      } catch (err) {
        console.error("Error fetching invitations:", err);
        // Silently handle the error - the table might not exist yet
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, []);

  const handleAcceptInvitation = async (token: string, id: number) => {
    setAcceptingInvitation(id);
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Invitation accepted",
          description: data.message,
        });
        
        // Remove the invitation from the list
        setInvitations(invitations.filter(inv => inv.id !== id));
        
        // Redirect to the organization page
        const invitation = invitations.find(inv => inv.id === id);
        if (invitation) {
          router.push(`/organizations/${invitation.organizationId}`);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to accept invitation",
        });
      }
    } catch (_error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept invitation",
      });
    } finally {
      setAcceptingInvitation(null);
    }
  };

  if (!loading && invitations.length === 0) {
    return null;
  }

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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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