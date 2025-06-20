import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

export async function enhanceOrganizationSchema() {
  console.log('🔄 Enhancing organization schema...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Create a Neon client
  const client = neon(databaseUrl);
  
  // Create a Drizzle instance
  const db = drizzle(client);

  try {
    // Create visibility enum if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility') THEN
          CREATE TYPE visibility AS ENUM ('public', 'private');
        END IF;
      END
      $$;
    `);

    // Add new columns to organizations table
    await db.execute(sql`
      ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS visibility visibility DEFAULT 'private',
      ADD COLUMN IF NOT EXISTS logo TEXT,
      ADD COLUMN IF NOT EXISTS website TEXT,
      ADD COLUMN IF NOT EXISTS settings JSONB;
    `);

    // Add new columns to organization_members table
    await db.execute(sql`
      ALTER TABLE organization_members
      ADD COLUMN IF NOT EXISTS title TEXT,
      ADD COLUMN IF NOT EXISTS invited_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // Update existing organizations to have a slug if they don't have one
    await db.execute(sql`
      UPDATE organizations
      SET slug = LOWER(REPLACE(name, ' ', '-'))
      WHERE slug IS NULL;
    `);

    // Make slug non-null after populating it
    await db.execute(sql`
      ALTER TABLE organizations
      ALTER COLUMN slug SET NOT NULL;
    `);

    console.log('✅ Organization schema enhanced successfully');
  } catch (error) {
    console.error('❌ Organization schema enhancement failed:', error);
    throw error;
  }
} 