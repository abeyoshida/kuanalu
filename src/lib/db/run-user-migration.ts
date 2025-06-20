import 'dotenv/config';
import { enhanceUserSchema } from './migrations/enhance-user-schema';

// This script runs only the user schema enhancement
async function main() {
  try {
    // Enhance user schema
    await enhanceUserSchema();
    
    console.log('✅ User schema enhancement completed successfully');
  } catch (error) {
    console.error('❌ User schema enhancement failed:', error);
    process.exit(1);
  }
}

main(); 