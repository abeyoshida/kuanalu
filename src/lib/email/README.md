# Email Setup for Kuanalu

This directory contains the email functionality for the Kuanalu application.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Email (Resend)
RESEND_API_KEY="your_resend_api_key"
EMAIL_FROM="noreply@yourdomain.com"
# Set to "log" to log emails instead of sending them in development
EMAIL_DEV_MODE="log"
```

## Getting a Resend API Key

1. Sign up for an account at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key from the dashboard
4. Add the API key to your environment variables

## Email Components

The email components are built using React Email components. The main components are:

- `BaseEmailLayout`: A base layout for all emails
- `InvitationEmail`: Email template for organization invitations

## Email Client

The `client.ts` file contains the Resend client setup and a utility function for sending emails.

## Email Rendering

The `render.ts` file contains utility functions for rendering React components to HTML for email sending.

## Usage Example

```typescript
import { sendEmail } from '@/lib/email/client';
import { InvitationEmail } from '@/components/email/invitation-email';

async function sendInvitationEmail(
  inviteeEmail: string,
  organizationName: string,
  inviterName: string,
  invitationUrl: string,
  role: string,
  expiresAt: Date
) {
  await sendEmail({
    to: inviteeEmail,
    subject: `You've been invited to join ${organizationName}`,
    react: (
      <InvitationEmail
        inviteeEmail={inviteeEmail}
        organizationName={organizationName}
        inviterName={inviterName}
        invitationUrl={invitationUrl}
        role={role}
        expiresAt={expiresAt}
      />
    ),
  });
}
``` 