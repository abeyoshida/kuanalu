import { processEmailQueue } from '@/lib/email/queue';

/**
 * Script to process the email queue
 * This can be run on a schedule using a cron job or serverless function
 */
async function main() {
  try {
    console.log('Starting email queue processing...');
    
    // Process up to 50 emails at a time
    const processedCount = await processEmailQueue(50);
    
    console.log(`Processed ${processedCount} emails from the queue`);
    process.exit(0);
  } catch (error) {
    console.error('Error processing email queue:', error);
    process.exit(1);
  }
}

// Run the script
main(); 