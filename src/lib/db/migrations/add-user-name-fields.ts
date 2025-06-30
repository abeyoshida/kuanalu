import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function addUserNameFields() {
  console.log('Adding first_name and last_name columns to users table...');

  try {
    // Check if columns already exist
    const columnsResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('first_name', 'last_name')
    `);

    // Type assertion for database result rows
    const existingColumns = columnsResult.rows.map((row) => row.column_name as string);
    
    // Add first_name column if it doesn't exist
    if (!existingColumns.includes('first_name')) {
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN first_name TEXT
      `);
      console.log('Added first_name column to users table');
    } else {
      console.log('first_name column already exists in users table');
    }

    // Add last_name column if it doesn't exist
    if (!existingColumns.includes('last_name')) {
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN last_name TEXT
      `);
      console.log('Added last_name column to users table');
    } else {
      console.log('last_name column already exists in users table');
    }

    console.log('Migration completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error adding name fields to users table:', error);
    throw error;
  }
} 