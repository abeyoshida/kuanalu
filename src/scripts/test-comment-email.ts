import { sendCommentEmail } from '@/lib/email/send-comment';

/**
 * Sleep for a specified number of milliseconds
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test script for sending comment notification emails
 */
async function main() {
  try {
    console.log('Sending test comment notification emails...');

    // Test regular comment notification
    const commentResult = await sendCommentEmail({
      recipientEmail: 'abeyoshida@gmail.com',
      recipientName: 'Task Owner',
      commenterName: 'John Doe',
      taskTitle: 'Implement email notifications',
      taskId: 123,
      commentId: 456,
      commentContent: 'I\'ve made some progress on this task. The email templates are now working correctly, but we still need to integrate them with the task update flow.',
      projectName: 'Kuanalu Email System',
      organizationName: 'Kuanalu',
      isMention: false,
    });
    
    console.log('Comment notification email sent:', commentResult);
    
    // Wait 1 second to avoid rate limits
    await sleep(1000);

    // Test mention notification
    const mentionResult = await sendCommentEmail({
      recipientEmail: 'abeyoshida@gmail.com',
      recipientName: 'Jane Smith',
      commenterName: 'John Doe',
      taskTitle: 'Implement email notifications',
      taskId: 123,
      commentId: 457,
      commentContent: 'Hey @Jane, could you review the email templates I\'ve created? I want to make sure they follow our design guidelines.',
      projectName: 'Kuanalu Email System',
      organizationName: 'Kuanalu',
      isMention: true,
    });
    
    console.log('Mention notification email sent:', mentionResult);

    console.log('All test emails sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }
}

main(); 