import { sendTaskUpdateEmail } from '@/lib/email/send-task-update';

/**
 * Sleep for a specified number of milliseconds
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test script for sending task update emails
 */
async function main() {
  try {
    console.log('Sending test task update emails...');

    // Test status update
    const statusResult = await sendTaskUpdateEmail({
      recipientEmail: 'abeyoshida@gmail.com',
      recipientName: 'Test User',
      updaterName: 'Admin User',
      taskTitle: 'Implement email notifications',
      taskId: 123,
      projectName: 'Kuanalu Email System',
      organizationName: 'Kuanalu',
      updateType: 'status',
      oldValue: 'todo',
      newValue: 'in_progress',
    });
    
    console.log('Status update email sent:', statusResult);
    
    // Wait 1 second to avoid rate limits
    await sleep(1000);

    // Test priority update
    const priorityResult = await sendTaskUpdateEmail({
      recipientEmail: 'abeyoshida@gmail.com',
      recipientName: 'Test User',
      updaterName: 'Admin User',
      taskTitle: 'Implement email notifications',
      taskId: 123,
      projectName: 'Kuanalu Email System',
      organizationName: 'Kuanalu',
      updateType: 'priority',
      oldValue: 'medium',
      newValue: 'high',
    });
    
    console.log('Priority update email sent:', priorityResult);
    
    // Wait 1 second to avoid rate limits
    await sleep(1000);

    // Test due date update
    const dueDateResult = await sendTaskUpdateEmail({
      recipientEmail: 'abeyoshida@gmail.com',
      recipientName: 'Test User',
      updaterName: 'Admin User',
      taskTitle: 'Implement email notifications',
      taskId: 123,
      projectName: 'Kuanalu Email System',
      organizationName: 'Kuanalu',
      updateType: 'dueDate',
      oldValue: new Date(Date.now()).toISOString(),
      newValue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    });
    
    console.log('Due date update email sent:', dueDateResult);
    
    // Wait 1 second to avoid rate limits
    await sleep(1000);

    // Test description update
    const descriptionResult = await sendTaskUpdateEmail({
      recipientEmail: 'abeyoshida@gmail.com',
      recipientName: 'Test User',
      updaterName: 'Admin User',
      taskTitle: 'Implement email notifications',
      taskId: 123,
      projectName: 'Kuanalu Email System',
      organizationName: 'Kuanalu',
      updateType: 'description',
    });
    
    console.log('Description update email sent:', descriptionResult);

    console.log('All test emails sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }
}

main(); 