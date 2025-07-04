# Resend Webhook Setup

This directory contains the webhook handler for Resend email delivery status updates. Webhooks allow you to receive real-time notifications about email events such as delivery, bounces, opens, and clicks.

## Setting Up Webhooks in Resend

1. Log in to your [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to the "Webhooks" section
3. Click "Add Webhook"
4. Enter your webhook URL: `https://your-domain.com/api/webhooks/resend`
5. Select the events you want to receive:
   - `email.sent` - Email was sent successfully
   - `email.delivered` - Email was delivered successfully
   - `email.delivery_delayed` - Email delivery was delayed
   - `email.complained` - Recipient marked the email as spam
   - `email.bounced` - Email bounced
   - `email.opened` - Email was opened
   - `email.clicked` - Link in email was clicked
6. Enable signing and copy the signing secret
7. Add the signing secret to your environment variables as `RESEND_WEBHOOK_SECRET`

## Environment Variables

Add the following environment variable to your `.env.local` file:

```
RESEND_WEBHOOK_SECRET=your_webhook_signing_secret
```

## Testing Webhooks

You can test webhooks locally using tools like [ngrok](https://ngrok.com/) or [Webhook.site](https://webhook.site/).

### Using ngrok

1. Install ngrok: `npm install -g ngrok`
2. Start your Next.js application: `npm run dev`
3. Start ngrok: `ngrok http 3000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Set up a webhook in Resend using the ngrok URL + `/api/webhooks/resend`
6. Send a test email using Resend
7. Check your application logs for webhook events

## Webhook Events

The webhook handler processes the following events:

- `email.sent` - Updates the email status to "sent" in the database
- `email.delivered` - Updates the email status to "delivered" in the database
- `email.delivery_delayed` - Updates the email status to "delayed" and records the reason
- `email.complained` - Updates the email status to "complained"
- `email.bounced` - Updates the email status to "bounced" and records the reason
- `email.opened` - Records open events with metadata (IP, user agent, location)
- `email.clicked` - Records click events with metadata (IP, user agent, location, URL)

## Security

The webhook handler verifies the signature of incoming webhooks using the `RESEND_WEBHOOK_SECRET` environment variable. This ensures that the webhook is actually coming from Resend and not a malicious actor.

If the signature verification fails, the webhook handler will return a 401 Unauthorized response.
