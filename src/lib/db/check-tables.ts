import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

async function checkTables() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('⏳ Connecting to database...');
  
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);
  
  try {
    // Try to query the users table
    const users = await db.select().from(schema.users).limit(1);
    console.log('✅ Users table exists:', users);
    
    // Try to query the organizations table
    const orgs = await db.select().from(schema.organizations).limit(1);
    console.log('✅ Organizations table exists:', orgs);
    
    // Try to query the projects table
    const projects = await db.select().from(schema.projects).limit(1);
    console.log('✅ Projects table exists:', projects);
    
    // Try to query the tasks table
    const tasks = await db.select().from(schema.tasks).limit(1);
    console.log('✅ Tasks table exists:', tasks);
    
    console.log('✅ Database connection and schema verified successfully');
  } catch (error) {
    console.error('❌ Error querying tables:', error);
  }
  
  process.exit(0);
}

checkTables().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 