import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { sql } from 'drizzle-orm';
import { addInvitationsTable } from './migrations/add-invitations-table';
import { enhanceOrganizationSchema } from './migrations/enhance-organization-schema';

// This script runs migrations on your database
async function main() {
  console.log('🔄 Running migrations...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Create a Neon client
  const client = neon(databaseUrl);
  
  // Create a Drizzle instance
  const db = drizzle(client);

  try {
    // This runs migrations from the 'drizzle' folder
    await migrate(db, { migrationsFolder: 'drizzle' });
    
    // Add bio column to users table if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS bio TEXT;
    `);
    
    // Add invitations table
    await addInvitationsTable();
    
    // Enhance organization schema
    await enhanceOrganizationSchema();
    
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main(); 