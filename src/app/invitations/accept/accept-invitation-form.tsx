'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface AcceptInvitationFormProps {
  token?: string;
}

export function AcceptInvitationForm({ token }: AcceptInvitationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [invitationDetails, setInvitationDetails] = useState<{
    email: string;
    organizationId: number;
    organizationName: string;
  } | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

        if (data.invitation.status !== 'pending') {
          throw new Error('This invitation has already been used or has expired');
        }

        setInvitationDetails({
          email: data.invitation.email,
          organizationId: data.invitation.organizationId,
          organizationName: data.invitation.organization.name,
        });
      } catch (error) {
        console.error('Error fetching invitation:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch invitation details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvitationDetails();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!token || !invitationDetails) return;
    
    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!password) {
      setError('Please enter a password');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Register and accept invitation in one step
      const response = await fetch('/api/invitations/accept-and-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          email: invitationDetails.email,
          password,
        }),
      });
      
      const data = await response.json();
      console.log('Accept response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept invitation');
      }
      
      setSuccess(true);
      
      // Redirect to the organization page after a short delay
      setTimeout(() => {
        router.push(`/organizations/${invitationDetails.organizationId}`);
      }, 2000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to accept invitation');
    } finally {
      setIsSubmitting(false);
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

  if (!invitationDetails) {
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
        <p className="text-sm text-gray-500">
          You have been invited to join <span className="font-medium">{invitationDetails.organizationName}</span>.
          Complete the form below to accept the invitation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={invitationDetails.email}
            disabled={true}
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">This is the email address the invitation was sent to.</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />
          <p className="text-xs text-gray-500">Password must be at least 8 characters.</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Accepting Invitation...
            </>
          ) : (
            "Accept Invitation"
          )}
        </Button>
      </form>
    </div>
  );
} 