import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function createTables() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('⏳ Connecting to database...');
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Create enums first
    console.log('Creating enums...');
    try {
      await sql`CREATE TYPE "priority" AS ENUM('low', 'medium', 'high', 'urgent')`;
    } catch {
      console.log('Priority enum may already exist, continuing...');
    }
    
    try {
      await sql`CREATE TYPE "task_status" AS ENUM('backlog', 'todo', 'in_progress', 'in_review', 'done')`;
    } catch {
      console.log('Task status enum may already exist, continuing...');
    }
    
    // Create organizations table
    console.log('Creating organizations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "organizations" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
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
    
    // Create organization_members table
    console.log('Creating organization_members table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "organization_members" (
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "organization_id" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "role" TEXT DEFAULT 'member' NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        PRIMARY KEY ("user_id", "organization_id")
      )
    `;
    
    // Create projects table
    console.log('Creating projects table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "organization_id" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    // Create tasks table
    console.log('Creating tasks table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" task_status DEFAULT 'todo' NOT NULL,
        "priority" priority DEFAULT 'medium' NOT NULL,
        "project_id" INTEGER NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "assignee_id" INTEGER REFERENCES "users"("id"),
        "due_date" TIMESTAMP,
        "created_by" INTEGER NOT NULL REFERENCES "users"("id"),
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    // Create subtasks table
    console.log('Creating subtasks table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "subtasks" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "completed" BOOLEAN DEFAULT FALSE NOT NULL,
        "task_id" INTEGER NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    // Create comments table
    console.log('Creating comments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "comments" (
        "id" SERIAL PRIMARY KEY,
        "content" TEXT NOT NULL,
        "task_id" INTEGER NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    console.log('✅ All tables created successfully');
  } catch (err) {
    console.error('❌ Error creating tables:', err);
  }
  
  process.exit(0);
}

createTables().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
}); 