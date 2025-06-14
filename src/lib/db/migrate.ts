import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

// This script runs migrations on your database
async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('⏳ Running migrations...');
  
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);
  
  // This runs migrations from the 'drizzle' folder
  await migrate(db, { migrationsFolder: 'drizzle' });
  
  console.log('✅ Migrations completed successfully');
  process.exit(0);
}

runMigration().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}); 