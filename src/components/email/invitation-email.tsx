import React from 'react';
import {
  Text,
  Button,
  Section,
  Heading,
} from '@react-email/components';
import { BaseEmailLayout } from './base-layout';

interface InvitationEmailProps {
  inviteeEmail: string;
  organizationName: string;
  inviterName: string;
  invitationUrl: string;
  role: string;
  expiresAt: Date;
}

export const InvitationEmail = ({
  inviteeEmail,
  organizationName,
  inviterName,
  invitationUrl,
  role,
  expiresAt,
}: InvitationEmailProps) => {
  // Format expiration date
  const expirationDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(expiresAt);

  // Format role for display (capitalize and replace underscores)
  const formattedRole = role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return (
    <BaseEmailLayout previewText={`You&apos;ve been invited to join ${organizationName}`}>
      <Heading style={styles.heading}>You&apos;ve been invited!</Heading>
      
      <Text style={styles.text}>
        Hello{' '}
        <span style={styles.highlight}>{inviteeEmail}</span>,
      </Text>
      
      <Text style={styles.text}>
        <span style={styles.highlight}>{inviterName}</span> has invited you to join{' '}
        <span style={styles.highlight}>{organizationName}</span> as a{' '}
        <span style={styles.highlight}>{formattedRole}</span>.
      </Text>
      
      <Section style={styles.buttonContainer}>
        <Button
          href={invitationUrl}
          style={styles.button}
        >
          Accept Invitation
        </Button>
      </Section>
      
      <Text style={styles.text}>
        This invitation will expire on {expirationDate}.
      </Text>
      
      <Text style={styles.text}>
        If you don&apos;t have an account yet, you&apos;ll be able to create one when you accept the invitation.
      </Text>
      
      <Text style={styles.text}>
        If you can&apos;t click the button above, copy and paste this URL into your browser:
      </Text>
      
      <Text style={styles.link}>
        {invitationUrl}
      </Text>
    </BaseEmailLayout>
  );
};

const styles = {
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '10px 0 24px',
  },
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#333',
    margin: '16px 0',
  },
  highlight: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 20px',
  },
  link: {
    fontSize: '14px',
    color: '#556cd6',
    wordBreak: 'break-all' as const,
  },
}; 