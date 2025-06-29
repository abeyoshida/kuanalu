import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { seedDatabase } from "@/lib/db/seed";
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config();

/**
 * Script to clear all tables in the database and reseed with fresh data
 */
async function main() {
  try {
    console.log("Starting database reset process...");
    
    // Verify DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not defined. Please check your .env file.");
    }
    
    // Clear tables in reverse order of dependencies
    console.log("Clearing comments...");
    await db.execute(sql`DELETE FROM comments`);
    
    console.log("Clearing subtasks...");
    await db.execute(sql`DELETE FROM subtasks`);
    
    console.log("Clearing tasks...");
    await db.execute(sql`DELETE FROM tasks`);
    
    console.log("Clearing project members...");
    await db.execute(sql`DELETE FROM project_members`);
    
    console.log("Clearing project category assignments...");
    await db.execute(sql`DELETE FROM project_category_assignments`);
    
    console.log("Clearing project categories...");
    await db.execute(sql`DELETE FROM project_categories`);
    
    console.log("Clearing projects...");
    await db.execute(sql`DELETE FROM projects`);
    
    console.log("Clearing organization members...");
    await db.execute(sql`DELETE FROM organization_members`);
    
    console.log("Clearing invitations...");
    await db.execute(sql`DELETE FROM invitations`);
    
    console.log("Clearing organizations...");
    await db.execute(sql`DELETE FROM organizations`);
    
    console.log("Clearing user permissions...");
    await db.execute(sql`DELETE FROM user_permissions`);
    
    console.log("Clearing user sessions...");
    await db.execute(sql`DELETE FROM user_sessions`);
    
    console.log("Clearing users...");
    await db.execute(sql`DELETE FROM users`);
    
    console.log("Database clearing completed!");
    
    // Reseed the database
    console.log("Reseeding database with fresh data...");
    await seedDatabase();
    
    console.log("Database reset and reseed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
}

main(); 