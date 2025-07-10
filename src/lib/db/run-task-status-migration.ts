import { updateTaskStatusEnum } from "./migrations/update-task-status-enum";

/**
 * Script to run the task status enum migration
 */
async function runMigration() {
  try {
    console.log("Starting task status migration...");
    await updateTaskStatusEnum();
    console.log("Task status migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 