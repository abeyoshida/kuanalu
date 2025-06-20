import { db } from '@/lib/db';
import { subtasks } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function enhanceSubtaskSchema() {
  console.log('Enhancing subtask schema...');

  // Add new columns to the subtasks table
  await db.execute(sql`
    ALTER TABLE subtasks
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS priority TEXT,
    ADD COLUMN IF NOT EXISTS assignee_id INTEGER REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS estimated_hours INTEGER,
    ADD COLUMN IF NOT EXISTS actual_hours INTEGER,
    ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS position INTEGER,
    ADD COLUMN IF NOT EXISTS metadata JSONB,
    ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
  `);

  // Create indexes for faster lookups - execute each statement separately
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_subtasks_assignee_id ON subtasks(assignee_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_subtasks_completed ON subtasks(completed);`);

  // Set default values for existing subtasks
  await db.execute(sql`
    UPDATE subtasks
    SET position = id
    WHERE position IS NULL;
  `);

  console.log('Subtask schema enhancement completed successfully');
}

// Run the migration if this file is executed directly
if (require.main === module) {
  enhanceSubtaskSchema()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error enhancing subtask schema:', error);
      process.exit(1);
    });
} 