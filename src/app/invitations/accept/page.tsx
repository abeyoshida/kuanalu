import { AcceptInvitationForm } from '@/app/invitations/accept/accept-invitation-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Accept Invitation | Kuanalu',
  description: 'Accept an invitation to join an organization',
};

interface AcceptInvitationPageProps {
  searchParams: { token?: string };
}

export default async function AcceptInvitationPage({
  searchParams
}: AcceptInvitationPageProps) {
  const token = searchParams?.token;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            Complete your registration to join the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInvitationForm token={token} />
        </CardContent>
      </Card>
    </div>
  );
} 