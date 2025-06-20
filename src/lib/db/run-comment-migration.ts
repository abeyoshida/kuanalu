// Load environment variables from .env file
import 'dotenv/config';

import { enhanceCommentSchema } from '@/lib/db/migrations/enhance-comment-schema';

// Run the migration
enhanceCommentSchema()
  .then(() => {
    console.log('Comment schema migration completed successfully');
    process.exit(0);
  })
  .catch((error: Error) => {
    console.error('Error running comment schema migration:', error);
    process.exit(1);
  }); 