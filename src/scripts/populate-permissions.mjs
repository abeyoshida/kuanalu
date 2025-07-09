import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define permission levels for different roles
const rolePermissions = {
  owner: [
    // Organization permissions
    { action: 'create', subject: 'organization' },
    { action: 'read', subject: 'organization' },
    { action: 'update', subject: 'organization' },
    { action: 'delete', subject: 'organization' },
    
    // Project permissions
    { action: 'create', subject: 'project' },
    { action: 'read', subject: 'project' },
    { action: 'update', subject: 'project' },
    { action: 'delete', subject: 'project' },
    
    // Task permissions
    { action: 'create', subject: 'task' },
    { action: 'read', subject: 'task' },
    { action: 'update', subject: 'task' },
    { action: 'delete', subject: 'task' },
    { action: 'assign', subject: 'task' },
    
    // Subtask permissions
    { action: 'create', subject: 'subtask' },
    { action: 'read', subject: 'subtask' },
    { action: 'update', subject: 'subtask' },
    { action: 'delete', subject: 'subtask' },
    
    // Comment permissions
    { action: 'create', subject: 'comment' },
    { action: 'read', subject: 'comment' },
    { action: 'update', subject: 'comment' },
    { action: 'delete', subject: 'comment' },
    
    // User management permissions
    { action: 'invite', subject: 'user' },
    { action: 'remove', subject: 'user' },
    { action: 'update-role', subject: 'user' },
  ],
  
  admin: [
    // Organization permissions
    { action: 'read', subject: 'organization' },
    { action: 'update', subject: 'organization' },
    
    // Project permissions
    { action: 'create', subject: 'project' },
    { action: 'read', subject: 'project' },
    { action: 'update', subject: 'project' },
    { action: 'delete', subject: 'project' },
    
    // Task permissions
    { action: 'create', subject: 'task' },
    { action: 'read', subject: 'task' },
    { action: 'update', subject: 'task' },
    { action: 'delete', subject: 'task' },
    { action: 'assign', subject: 'task' },
    
    // Subtask permissions
    { action: 'create', subject: 'subtask' },
    { action: 'read', subject: 'subtask' },
    { action: 'update', subject: 'subtask' },
    { action: 'delete', subject: 'subtask' },
    
    // Comment permissions
    { action: 'create', subject: 'comment' },
    { action: 'read', subject: 'comment' },
    { action: 'update', subject: 'comment' },
    { action: 'delete', subject: 'comment' },
    
    // User management permissions
    { action: 'invite', subject: 'user' },
  ],
  
  member: [
    // Organization permissions
    { action: 'read', subject: 'organization' },
    
    // Project permissions
    { action: 'read', subject: 'project' },
    
    // Task permissions
    { action: 'create', subject: 'task' },
    { action: 'read', subject: 'task' },
    { action: 'update', subject: 'task' },
    
    // Subtask permissions
    { action: 'create', subject: 'subtask' },
    { action: 'read', subject: 'subtask' },
    { action: 'update', subject: 'subtask' },
    
    // Comment permissions
    { action: 'create', subject: 'comment' },
    { action: 'read', subject: 'comment' },
    { action: 'update', subject: 'comment' },
  ],
  
  guest: [
    // Organization permissions
    { action: 'read', subject: 'organization' },
    
    // Project permissions
    { action: 'read', subject: 'project' },
    
    // Task permissions
    { action: 'read', subject: 'task' },
    
    // Subtask permissions
    { action: 'read', subject: 'subtask' },
    
    // Comment permissions
    { action: 'read', subject: 'comment' },
  ],
};

/**
 * Script to populate user_permissions table based on role-based permissions
 * This script will:
 * 1. Get all users and their organization memberships
 * 2. For each user-organization pair, get the user's role
 * 3. Based on the role, create appropriate permission entries in the user_permissions table
 */
async function main() {
  try {
    console.log('Starting user permissions population...');
    
    // Verify DATABASE_URL is available
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not defined. Please check your .env file.');
    }
    
    // Create database connection
    const client = neon(databaseUrl);
    const db = drizzle(client);
    
    // Get all organization members with their roles
    console.log('Fetching organization members...');
    const members = await db.execute(sql`
      SELECT user_id, organization_id, role
      FROM organization_members
    `);
    
    console.log(`Found ${members.rows.length} organization memberships`);
    
    // Clear existing permissions to avoid duplicates
    console.log('Clearing existing user permissions...');
    await db.execute(sql`DELETE FROM user_permissions`);
    
    // Process each member and create permissions
    console.log('Creating user permissions based on roles...');
    let permissionsCreated = 0;
    
    for (const member of members.rows) {
      const userId = Number(member.user_id);
      const organizationId = Number(member.organization_id);
      const role = member.role;
      
      // Get permissions for this role
      const permissions = rolePermissions[role];
      
      if (!permissions) {
        console.warn(`No permissions defined for role: ${role}`);
        continue;
      }
      
      // Create permission entries for this user
      for (const permission of permissions) {
        try {
          await db.execute(sql`
            INSERT INTO user_permissions (
              user_id, organization_id, resource, action, granted, created_at, updated_at
            ) VALUES (
              ${userId}, ${organizationId}, ${permission.subject}, ${permission.action}, 
              true, NOW(), NOW()
            )
          `);
          
          permissionsCreated++;
        } catch (error) {
          console.error(`Error creating permission for user ${userId}, organization ${organizationId}, resource ${permission.subject}, action ${permission.action}:`, error);
        }
      }
    }
    
    console.log(`Successfully created ${permissionsCreated} permission entries`);
    console.log('User permissions population completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error populating user permissions:', error);
    process.exit(1);
  }
}

// Execute the script
main(); 