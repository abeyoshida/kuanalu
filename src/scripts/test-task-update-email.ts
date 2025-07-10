import { sendTaskUpdateEmail } from '@/lib/email/send-task-update';

/**
 * Test script for sending task update emails
 */
async function main() {
  try {
    console.log('Sending test task update emails...');

    // Example 1: Status update
    await sendTaskUpdateEmail({
      recipientEmail: 'user@example.com',
      recipientName: 'John Doe',
      updaterName: 'Admin User',
      taskTitle: 'Implement email notifications',
      taskId: 123,
      projectName: 'FlowBoardAI Email System',
      organizationName: 'FlowBoardAI',
      updateType: 'status',
      oldValue: 'In Progress',
      newValue: 'In Review'
    });

    // Example 2: Priority update
    await sendTaskUpdateEmail({
      recipientEmail: 'user@example.com',
      recipientName: 'John Doe',
      updaterName: 'Admin User',
      taskTitle: 'Fix authentication bug',
      taskId: 124,
      projectName: 'FlowBoardAI Email System',
      organizationName: 'FlowBoardAI',
      updateType: 'priority',
      oldValue: 'Medium',
      newValue: 'High'
    });

    // Example 3: Due date update
    await sendTaskUpdateEmail({
      recipientEmail: 'user@example.com',
      recipientName: 'John Doe',
      updaterName: 'Admin User',
      taskTitle: 'Deploy to production',
      taskId: 125,
      projectName: 'FlowBoardAI Email System',
      organizationName: 'FlowBoardAI',
      updateType: 'dueDate',
      oldValue: '2023-12-01',
      newValue: '2023-12-15'
    });

    // Example 4: Description update
    await sendTaskUpdateEmail({
      recipientEmail: 'user@example.com',
      recipientName: 'John Doe',
      updaterName: 'Admin User',
      taskTitle: 'Update documentation',
      taskId: 126,
      projectName: 'FlowBoardAI Email System',
      organizationName: 'FlowBoardAI',
      updateType: 'description',
      oldValue: 'Old description',
      newValue: 'New detailed description'
    });

    console.log('All test emails sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }
}

main(); 