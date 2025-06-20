import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

export async function enhanceTaskSchema() {
  console.log('🔄 Enhancing task schema...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Create a Neon client
  const client = neon(databaseUrl);
  
  // Create a Drizzle instance
  const db = drizzle(client);

  try {
    // Create task type enum if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
          CREATE TYPE task_type AS ENUM ('feature', 'bug', 'improvement', 'documentation', 'task', 'epic');
        END IF;
      END
      $$;
    `);

    // Add new columns to tasks table
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS type task_type DEFAULT 'task';
    `);
    
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS reporter_id INTEGER REFERENCES users(id);
    `);
    
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS parent_task_id INTEGER REFERENCES tasks(id);
    `);
    
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
    `);
    
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;
    `);
    
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS actual_hours INTEGER;
    `);
    
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS points INTEGER;
    `);
    
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS position INTEGER;
    `);
    
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS labels JSONB;
    `);
    
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS metadata JSONB;
    `);
    
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
    `);
    
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
    `);

    // Populate reporter_id with created_by if null
    await db.execute(sql`
      UPDATE tasks
      SET reporter_id = created_by
      WHERE reporter_id IS NULL;
    `);

    // Set position for existing tasks based on id to maintain order
    await db.execute(sql`
      UPDATE tasks
      SET position = id
      WHERE position IS NULL;
    `);

    // Set completed_at for tasks that are already done
    await db.execute(sql`
      UPDATE tasks
      SET completed_at = updated_at
      WHERE status = 'done' AND completed_at IS NULL;
    `);

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_reporter_id ON tasks(reporter_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON tasks(archived_at);
    `);

    console.log('✅ Task schema enhanced successfully');
  } catch (error) {
    console.error('❌ Task schema enhancement failed:', error);
    throw error;
  }
} 