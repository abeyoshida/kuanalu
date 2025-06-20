import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function addInvitationsTable() {
  try {
    console.log("Creating invitations table...");
    
    // Create the invitations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        token UUID NOT NULL UNIQUE,
        email TEXT NOT NULL,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        invited_by INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        
        -- Add index for faster lookups by email
        CONSTRAINT idx_invitations_email_org UNIQUE (email, organization_id, status)
      );
      
      -- Add indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
      CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
      CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
    `);
    
    console.log("Invitations table created successfully!");
  } catch (error) {
    console.error("Error creating invitations table:", error);
    throw error;
  }
} 