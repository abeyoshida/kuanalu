import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function enhanceRelationships() {
  console.log('Enhancing schema relationships...');

  // Add task parent-child relationship constraint
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tasks_parent_task_id_fkey'
      ) THEN
        ALTER TABLE tasks
        ADD CONSTRAINT tasks_parent_task_id_fkey
        FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL;
      END IF;
    END
    $$;
  `);

  // Add comment parent-child relationship constraint
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'comments_parent_id_fkey'
      ) THEN
        ALTER TABLE comments
        ADD CONSTRAINT comments_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
      END IF;
    END
    $$;
  `);

  // Add subtask assignee constraint
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subtasks_assignee_id_fkey'
      ) THEN
        ALTER TABLE subtasks
        ADD CONSTRAINT subtasks_assignee_id_fkey
        FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL;
      END IF;
    END
    $$;
  `);

  // Add subtask creator constraint
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subtasks_created_by_fkey'
      ) THEN
        ALTER TABLE subtasks
        ADD CONSTRAINT subtasks_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
      END IF;
    END
    $$;
  `);

  // Create additional indexes for performance
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tasks_reporter_id ON tasks(reporter_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);`);

  console.log('Schema relationships enhanced successfully');
}

// Run the migration if this file is executed directly
if (require.main === module) {
  enhanceRelationships()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error enhancing schema relationships:', error);
      process.exit(1);
    });
} 