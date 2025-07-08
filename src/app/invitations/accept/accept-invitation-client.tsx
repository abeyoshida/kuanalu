'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface AcceptInvitationClientProps {
  token?: string;
}

interface InvitationDetails {
  id: number;
  email: string;
  organizationId: number;
  role: string;
  status: string;
  expiresAt: string;
  organization: {
    id: number;
    name: string;
  };
}

export function AcceptInvitationClient({ token }: AcceptInvitationClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch invitation details on component mount
  useEffect(() => {
    async function fetchInvitationDetails() {
      if (!token) {
        setError('Invalid invitation link. No token provided.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/invitations/${token}`, {
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();
        console.log('Invitation data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch invitation details');
        }

        setInvitation(data.invitation);
      } catch (error) {
        console.error('Error fetching invitation:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch invitation details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvitationDetails();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    
    setIsAccepting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      console.log('Accept response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept invitation');
      }
      
      setSuccess(true);
      
      // Redirect to the organization page after a short delay
      setTimeout(() => {
        router.push(`/organizations/${invitation?.organizationId}`);
      }, 2000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading invitation details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert className="bg-green-50 border-green-200 mb-4">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          Invitation accepted successfully! Redirecting to organization page...
        </AlertDescription>
      </Alert>
    );
  }

  if (!invitation) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Invalid or expired invitation.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Invitation Details</h3>
        <p className="text-sm text-gray-500">
          You have been invited to join <span className="font-medium">{invitation.organization.name}</span> with the role of <span className="font-medium">{invitation.role}</span>.
        </p>
        {invitation.expiresAt && (
          <p className="text-xs text-gray-400">
            This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}.
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => router.push('/organizations')} disabled={isAccepting}>
          Decline
        </Button>
        <Button onClick={handleAccept} disabled={isAccepting || invitation.status !== 'pending'}>
          {isAccepting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Accepting...
            </>
          ) : (
            "Accept Invitation"
          )}
        </Button>
      </div>
    </div>
  );
} 