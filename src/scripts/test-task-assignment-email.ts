import { sendTaskAssignmentEmail } from '@/lib/email/send-task-assignment';

/**
 * Test script for sending task assignment emails
 */
async function main() {
  try {
    console.log('Sending test task assignment email...');

    const result = await sendTaskAssignmentEmail({
      recipientEmail: 'delivered@resend.dev', // Valid test email for Resend
      recipientName: 'Test User',
      assignerName: 'Admin User',
      taskTitle: 'Implement task assignment email template',
      taskId: 123,
      projectName: 'Kuanalu Email System',
      organizationName: 'Kuanalu',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      priority: 'high',
    });

    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }
}

main(); 