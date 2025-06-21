import { seedDatabase } from "@/lib/db/seed";
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config();

/**
 * Script to seed the database with sample data for development
 */
async function main() {
  try {
    console.log("Starting database seeding process...");
    
    // Verify DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not defined. Please check your .env file.");
    }
    
    await seedDatabase();
    console.log("Database seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

main(); 