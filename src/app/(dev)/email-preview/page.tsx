'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EmailPreviewPage() {
  // Only show this page in development mode
  const [isDev, setIsDev] = useState(false);
  
  // Email preview state
  const [emailType, setEmailType] = useState('invitation');
  const [email, setEmail] = useState('user@example.com');
  const [orgName, setOrgName] = useState('Example Organization');
  const [inviterName, setInviterName] = useState('John Doe');
  const [role, setRole] = useState('member');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    // Check if we're in development mode
    fetch('/api/email/preview', { method: 'HEAD' })
      .then(response => {
        if (response.status !== 403) {
          setIsDev(true);
          updatePreviewUrl();
        }
      })
      .catch(() => {
        setIsDev(false);
      });
  }, []);

  const updatePreviewUrl = () => {
    let url = `/api/email/preview?type=${emailType}`;
    
    if (emailType === 'invitation') {
      url += `&email=${encodeURIComponent(email)}`;
      url += `&org=${encodeURIComponent(orgName)}`;
      url += `&inviter=${encodeURIComponent(inviterName)}`;
      url += `&role=${encodeURIComponent(role)}`;
    }
    
    setPreviewUrl(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreviewUrl();
  };

  if (!isDev) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Email Preview</h1>
        <p className="text-red-500">
          This page is only available in development mode.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Email Preview Tool</h1>
      <p className="mb-6 text-gray-500">
        Use this tool to preview email templates during development.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure the email template parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailType">Email Type</Label>
                  <Select
                    value={emailType}
                    onValueChange={(value) => {
                      setEmailType(value);
                      setTimeout(updatePreviewUrl, 0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select email type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invitation">Invitation Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {emailType === 'invitation' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Recipient Email</Label>
                      <Input
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Example Organization"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inviterName">Inviter Name</Label>
                      <Input
                        id="inviterName"
                        value={inviterName}
                        onChange={(e) => setInviterName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={role}
                        onValueChange={setRole}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="guest">Guest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full">
                  Update Preview
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>
                Preview how the email will look
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[600px]">
              <Tabs defaultValue="preview" className="h-full">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="url">URL</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="h-full">
                  {previewUrl ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border rounded"
                      title="Email Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">
                        Click &quot;Update Preview&quot; to see the email
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="url">
                  <div className="p-4 bg-gray-100 rounded overflow-auto">
                    <code className="text-sm break-all">{previewUrl}</code>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(previewUrl);
                      }}
                    >
                      Copy URL
                    </Button>
                    <Button
                      variant="outline"
                      className="ml-2"
                      onClick={() => {
                        window.open(previewUrl, '_blank');
                      }}
                    >
                      Open in New Tab
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 