import {
  Container,
  Button,
  Heading,
  Link,
  Section,
  Text,
} from '@react-email/components';
import { BaseEmailLayout } from './base-layout';

interface InvitationEmailProps {
  inviterName: string;
  organizationName: string;
  inviteeEmail: string;
  role: string;
  acceptUrl: string;
}

export function InvitationEmail({
  inviterName,
  organizationName,
  inviteeEmail,
  role,
  acceptUrl,
}: InvitationEmailProps) {
  const previewText = `You&apos;ve been invited to join ${organizationName}`;

  return (
    <BaseEmailLayout previewText={previewText}>
      <Container className="px-8 mx-auto">
        <Heading className="text-xl font-bold mb-4">
          You&apos;ve been invited to join {organizationName}
        </Heading>
        
        <Text className="mb-4">
          Hello,
        </Text>
        
        <Text className="mb-4">
          {inviterName} has invited you to join <strong>{organizationName}</strong> as a <strong>{role}</strong>.
        </Text>
        
        <Text className="mb-4">
          This invitation was sent to <strong>{inviteeEmail}</strong>. If you weren&apos;t expecting this invitation, you can ignore this email.
        </Text>
        
        <Section className="text-center mt-8 mb-8" style={{ textAlign: 'center' }}>
          <Button
            className="bg-primary text-white font-bold py-3 px-6 rounded"
            href={acceptUrl}
            style={{
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              padding: "12px 20px",
              borderRadius: "4px",
              textDecoration: "none",
              fontWeight: "bold",
              display: "inline-block"
            }}
          >
            Accept Invitation
          </Button>
        </Section>
        
        <Text className="text-sm text-gray-500 mb-0">
          If the button doesn&apos;t work, copy and paste this URL into your browser: <Link href={acceptUrl} className="text-blue-600">{acceptUrl}</Link>
        </Text>
      </Container>
    </BaseEmailLayout>
  );
} 