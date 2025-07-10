import { db } from "../index";
import { sql } from "drizzle-orm";

/**
 * Migration to update task status values:
 * - 'backlog' -> 'todo'
 * - 'todo' -> 'today'
 */
export async function updateTaskStatusEnum() {
  console.log("Starting task status enum migration...");
  
  try {
    // First, update the enum type in PostgreSQL
    console.log("Updating task_status enum type...");
    
    // Step 1: Rename the old enum type
    console.log("Step 1: Rename the old enum type");
    await db.execute(sql`ALTER TYPE task_status RENAME TO task_status_old;`);
    
    // Step 2: Create the new enum type
    console.log("Step 2: Create the new enum type");
    await db.execute(sql`CREATE TYPE task_status AS ENUM ('todo', 'today', 'in_progress', 'in_review', 'done');`);
    
    // Step 3: Update the column using the new enum type
    console.log("Step 3: Update the column using the new enum type");
    await db.execute(sql`
      ALTER TABLE tasks ALTER COLUMN status TYPE task_status USING 
        CASE 
          WHEN status::text = 'backlog' THEN 'todo'::task_status
          WHEN status::text = 'todo' THEN 'today'::task_status
          ELSE status::text::task_status
        END;
    `);
    
    // Step 4: Drop the old enum type
    console.log("Step 4: Drop the old enum type");
    await db.execute(sql`DROP TYPE task_status_old;`);
    
    console.log("Task status enum migration completed successfully!");
  } catch (error) {
    console.error("Error during task status enum migration:", error);
    throw error;
  }
} 