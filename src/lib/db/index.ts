import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config();

// Check if we have a database URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a SQL query executor using Neon's serverless driver
const sql = neon(process.env.DATABASE_URL);

// Create a Drizzle ORM instance
export const db = drizzle(sql); 