import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function createUsersTable() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('⏳ Connecting to database...');
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Create users table
    console.log('Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT,
        "image" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    console.log('✅ Users table created successfully');
  } catch (error) {
    console.error('❌ Error creating users table:', error);
  }
  
  process.exit(0);
}

createUsersTable().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 