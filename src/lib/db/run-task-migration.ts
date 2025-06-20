import 'dotenv/config';
import { enhanceTaskSchema } from './migrations/enhance-task-schema';

// This script runs only the task schema enhancement
async function main() {
  try {
    // Enhance task schema
    await enhanceTaskSchema();
    
    console.log('✅ Task schema enhancement completed successfully');
  } catch (error) {
    console.error('❌ Task schema enhancement failed:', error);
    process.exit(1);
  }
}

main(); 