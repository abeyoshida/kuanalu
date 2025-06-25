"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

interface LoginFormProps {
  callbackUrl?: string;
  registered?: boolean;
}

export function LoginForm({ callbackUrl = "/dashboard", registered = false }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Get values from URL search params
  const urlCallbackUrl = searchParams.get("callbackUrl") || callbackUrl;
  const urlRegistered = searchParams.get("registered") === "true" || registered;
  
  // Set success message if registered param is true
  const [success, setSuccess] = useState<string | null>(
    urlRegistered ? "Account created successfully! You can now sign in." : null
  );

  // Handle redirect separately to ensure it completes
  useEffect(() => {
    if (isRedirecting) {
      router.push(urlCallbackUrl);
      router.refresh();
    }
  }, [isRedirecting, router, urlCallbackUrl]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use NextAuth's signIn function
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: urlCallbackUrl,
      });
      
      if (result?.error) {
        setError(`Authentication failed: ${result.error}`);
        setIsLoading(false);
        return;
      }

      // Set success message
      setSuccess("Login successful! Redirecting...");
      
      // Set a small delay to ensure state updates before redirect
      setTimeout(() => {
        setIsRedirecting(true);
      }, 500);
      
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me
            </label>
          </div>

          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isLoading || isRedirecting}
          >
            {isLoading || isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isRedirecting ? "Redirecting..." : "Signing in..."}
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
} 