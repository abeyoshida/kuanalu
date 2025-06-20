// Load environment variables from .env file
import 'dotenv/config';

import { enhanceRelationships } from '@/lib/db/migrations/enhance-relationships';

// Run the migration
enhanceRelationships()
  .then(() => {
    console.log('Schema relationships migration completed successfully');
    process.exit(0);
  })
  .catch((error: Error) => {
    console.error('Error running schema relationships migration:', error);
    process.exit(1);
  }); 