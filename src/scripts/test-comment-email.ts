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
      recipientEmail: 'user@example.com',
      recipientName: 'John Doe',
      commenterName: 'Admin User',
      taskTitle: 'Implement email notifications',
      taskId: 123,
      commentId: 456,
      commentContent: 'This is a test comment for the email template.',
      projectName: 'FlowBoardAI Email System',
      organizationName: 'FlowBoardAI',
      isMention: false
    });
    
    console.log('Comment notification email sent:', commentResult);
    
    // Wait 1 second to avoid rate limits
    await sleep(1000);

    // Test mention notification
    const mentionResult = await sendCommentEmail({
      recipientEmail: 'user@example.com',
      recipientName: 'John Doe',
      commenterName: 'Admin User',
      taskTitle: 'Implement email notifications',
      taskId: 123,
      commentId: 457,
      commentContent: 'Hey @John, can you review this implementation?',
      projectName: 'FlowBoardAI Email System',
      organizationName: 'FlowBoardAI',
      isMention: true
    });
    
    console.log('Mention notification email sent:', mentionResult);

    console.log('All test emails sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }
}

main(); 