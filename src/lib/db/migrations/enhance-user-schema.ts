import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

export async function enhanceUserSchema() {
  console.log('🔄 Enhancing user schema...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Create a Neon client
  const client = neon(databaseUrl);
  
  // Create a Drizzle instance
  const db = drizzle(client);

  try {
    // Create user status enum if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
          CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
        END IF;
      END
      $$;
    `);

    // Add new columns to users table
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS job_title TEXT;
    `);
    
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS department TEXT;
    `);
    
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS location TEXT;
    `);
    
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS timezone TEXT;
    `);
    
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone_number TEXT;
    `);
    
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active';
    `);
    
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
    `);
    
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_active TIMESTAMP;
    `);
    
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS preferences JSONB;
    `);
    
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS metadata JSONB;
    `);

    // Create user sessions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        ip_address TEXT,
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create user permissions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        granted BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(user_id, resource, action, organization_id, project_id)
      );
    `);

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON user_permissions(resource);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_org_id ON user_permissions(organization_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_project_id ON user_permissions(project_id);
    `);

    console.log('✅ User schema enhanced successfully');
  } catch (error) {
    console.error('❌ User schema enhancement failed:', error);
    throw error;
  }
} 