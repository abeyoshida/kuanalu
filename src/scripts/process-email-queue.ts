import { processEmailQueue } from '@/lib/email/queue';

async function main() {
  try {
    console.log('Processing email queue...');
    const processedCount = await processEmailQueue(50);
    console.log(`Processed ${processedCount} emails from the queue`);
  } catch (error) {
    console.error('Error processing email queue:', error);
  }
}

// Run the script
main().then(() => process.exit(0)).catch(() => process.exit(1)); 