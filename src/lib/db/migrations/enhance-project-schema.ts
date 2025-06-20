import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

export async function enhanceProjectSchema() {
  console.log('🔄 Enhancing project schema...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Create a Neon client
  const client = neon(databaseUrl);
  
  // Create a Drizzle instance
  const db = drizzle(client);

  try {
    // Create project status enum if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
          CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'canceled');
        END IF;
      END
      $$;
    `);

    // Create project visibility enum if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_visibility') THEN
          CREATE TYPE project_visibility AS ENUM ('public', 'private', 'team_only');
        END IF;
      END
      $$;
    `);

    // Add new columns to projects table
    await db.execute(sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
    `);
    
    await db.execute(sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS status project_status DEFAULT 'planning';
    `);
    
    await db.execute(sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS visibility project_visibility DEFAULT 'private';
    `);
    
    await db.execute(sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);
    `);
    
    await db.execute(sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
    `);
    
    await db.execute(sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS target_date TIMESTAMP;
    `);
    
    await db.execute(sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP;
    `);
    
    await db.execute(sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS icon TEXT;
    `);
    
    await db.execute(sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS color TEXT;
    `);
    
    await db.execute(sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS metadata JSONB;
    `);
    
    await db.execute(sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS settings JSONB;
    `);
    
    await db.execute(sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
    `);

    // Update existing projects to have a slug if they don't have one
    await db.execute(sql`
      UPDATE projects
      SET slug = LOWER(REPLACE(name, ' ', '-'))
      WHERE slug IS NULL;
    `);

    // Update existing projects to have an owner if they don't have one
    await db.execute(sql`
      WITH project_owners AS (
        SELECT DISTINCT ON (p.id) 
          p.id AS project_id, 
          om.user_id AS owner_id
        FROM projects p
        JOIN organization_members om ON p.organization_id = om.organization_id
        WHERE om.role = 'owner' AND p.owner_id IS NULL
      )
      UPDATE projects
      SET owner_id = po.owner_id
      FROM project_owners po
      WHERE projects.id = po.project_id AND projects.owner_id IS NULL;
    `);

    // Make slug and owner_id non-null after populating them
    await db.execute(sql`
      ALTER TABLE projects
      ALTER COLUMN slug SET NOT NULL,
      ALTER COLUMN owner_id SET NOT NULL;
    `);

    // Create project members table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS project_members (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        added_by INTEGER REFERENCES users(id),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (user_id, project_id)
      );
    `);

    // Create project categories table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS project_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create project category assignments table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS project_category_assignments (
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES project_categories(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (project_id, category_id)
      );
    `);

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_project_categories_organization_id ON project_categories(organization_id);
    `);

    // Populate project_members table with project owners
    await db.execute(sql`
      INSERT INTO project_members (user_id, project_id, role, added_by, joined_at, created_at)
      SELECT 
        p.owner_id, 
        p.id, 
        'owner', 
        p.owner_id, 
        p.created_at, 
        p.created_at
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND p.owner_id = pm.user_id
      WHERE pm.user_id IS NULL;
    `);

    console.log('✅ Project schema enhanced successfully');
  } catch (error) {
    console.error('❌ Project schema enhancement failed:', error);
    throw error;
  }
} 