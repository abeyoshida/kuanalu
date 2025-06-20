// Load environment variables from .env file
import 'dotenv/config';

import { enhanceSubtaskSchema } from '@/lib/db/migrations/enhance-subtask-schema';

// Run the migration
enhanceSubtaskSchema()
  .then(() => {
    console.log('Subtask schema migration completed successfully');
    process.exit(0);
  })
  .catch((error: Error) => {
    console.error('Error running subtask schema migration:', error);
    process.exit(1);
  }); 