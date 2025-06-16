require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { sql } = require('drizzle-orm');

// This script sets up the role-based access control system in the database
async function main() {
  console.log('🔄 Setting up role-based access control...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Create a Neon client
  const client = neon(databaseUrl);
  
  // Create a Drizzle instance
  const db = drizzle(client);

  try {
    // Create role enum type if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
          CREATE TYPE role AS ENUM ('owner', 'admin', 'member', 'guest');
        END IF;
      END
      $$;
    `);
    
    // Check if organization_members table has a role column of type text
    const roleColumnCheck = await db.execute(sql`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'organization_members' AND column_name = 'role';
    `);
    
    // If role column exists and is of type text, alter it to use the role enum
    if (roleColumnCheck.rows.length > 0 && roleColumnCheck.rows[0].data_type === 'text') {
      console.log('Converting role column from text to role enum...');
      
      // First, drop the default constraint
      await db.execute(sql`
        ALTER TABLE organization_members 
        ALTER COLUMN role DROP DEFAULT;
      `);
      
      // Then convert the column type
      await db.execute(sql`
        ALTER TABLE organization_members 
        ALTER COLUMN role TYPE role USING role::role;
      `);
      
      // Finally, add the default constraint back with the enum type
      await db.execute(sql`
        ALTER TABLE organization_members 
        ALTER COLUMN role SET DEFAULT 'member'::role;
      `);
    }
    
    console.log('✅ Role-based access control setup completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main(); 