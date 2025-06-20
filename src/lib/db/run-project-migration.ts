import 'dotenv/config';
import { enhanceProjectSchema } from './migrations/enhance-project-schema';

// This script runs only the project schema enhancement
async function main() {
  try {
    // Enhance project schema
    await enhanceProjectSchema();
    
    console.log('✅ Project schema enhancement completed successfully');
  } catch (error) {
    console.error('❌ Project schema enhancement failed:', error);
    process.exit(1);
  }
}

main(); 