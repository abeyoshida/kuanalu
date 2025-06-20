import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function enhanceCommentSchema() {
  console.log('Enhancing comment schema...');

  // Add comment type enum
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comment_type') THEN
        CREATE TYPE comment_type AS ENUM ('text', 'code', 'attachment', 'system', 'mention');
      END IF;
    END
    $$;
  `);

  // Add new columns to the comments table
  await db.execute(sql`
    ALTER TABLE comments
    ADD COLUMN IF NOT EXISTS type comment_type DEFAULT 'text',
    ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS edited_by INTEGER REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS resolved_by INTEGER REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS metadata JSONB,
    ADD COLUMN IF NOT EXISTS mentions JSONB;
  `);

  // Create indexes for faster lookups
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_comments_is_resolved ON comments(is_resolved);`);

  console.log('Comment schema enhancement completed successfully');
}

// Run the migration if this file is executed directly
if (require.main === module) {
  enhanceCommentSchema()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error enhancing comment schema:', error);
      process.exit(1);
    });
} 