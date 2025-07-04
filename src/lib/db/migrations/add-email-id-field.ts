import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Migration to add the emailId field to the email_queue table
 */
export async function addEmailIdField() {
  console.log('Adding emailId field to email_queue table...');
  
  try {
    // Check if the column already exists
    const checkColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'email_queue' AND column_name = 'email_id'
    `);
    
    if (checkColumnExists.rows.length === 0) {
      // Add the email_id column
      await db.execute(sql`
        ALTER TABLE email_queue 
        ADD COLUMN IF NOT EXISTS email_id TEXT
      `);
      
      console.log('Successfully added emailId field to email_queue table');
    } else {
      console.log('emailId field already exists in email_queue table');
    }
    
    return true;
  } catch (error) {
    console.error('Error adding emailId field to email_queue table:', error);
    return false;
  }
}
