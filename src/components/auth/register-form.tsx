'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const invitedEmail = searchParams?.get('email') || '';
  const invitationToken = searchParams?.get('invitationToken') || '';
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  
  // Update email if searchParams change
  useEffect(() => {
    if (invitedEmail) {
      setEmail(invitedEmail);
    }
  }, [invitedEmail]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Basic validation
    if (!firstName.trim()) {
      setError('First name is required');
      setIsLoading(false);
      return;
    }
    
    if (!lastName.trim()) {
      setError('Last name is required');
      setIsLoading(false);
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }
    
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }
    
    // Only require organization name if there's no invitation token
    if (!invitationToken && !organizationName.trim()) {
      setError('Organization name is required');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`, // Full name for compatibility
          email,
          password,
          organizationName: organizationName.trim(),
          invitationToken,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Redirect to login page with success message and callback URL
      router.push(`/auth/login?registered=true&callbackUrl=${encodeURIComponent(callbackUrl)}&email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || !!invitedEmail}
            required
          />
        </div>
        
        {/* Only show organization field if user is not being invited */}
        {!invitationToken && (
          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              type="text"
              placeholder="Acme Inc"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            "Register"
          )}
        </Button>
      </form>
      
      <div className="text-center text-sm">
        Already have an account?{' '}
        <Link href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
} 