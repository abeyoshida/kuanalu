import 'dotenv/config';
import { enhanceOrganizationSchema } from './migrations/enhance-organization-schema';

// This script runs only the organization schema enhancement
async function main() {
  try {
    // Enhance organization schema
    await enhanceOrganizationSchema();
    
    console.log('✅ Organization schema enhancement completed successfully');
  } catch (error) {
    console.error('❌ Organization schema enhancement failed:', error);
    process.exit(1);
  }
}

main(); 