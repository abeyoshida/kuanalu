import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { rolePermissions } from '../../auth/permissions-data';

export async function createRolePermissionsTable() {
  console.log('🔄 Creating role_permissions table...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Create a Neon client
  const client = neon(databaseUrl);
  
  // Create a Drizzle instance
  const db = drizzle(client);

  try {
    // Create role_permissions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role TEXT NOT NULL,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        granted BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(role, resource, action)
      );
    `);

    // Clear existing role permissions to avoid duplicates
    await db.execute(sql`DELETE FROM role_permissions`);
    
    // Populate the table with the permissions from permissions-data.ts
    console.log('Populating role_permissions table...');
    let permissionsCreated = 0;
    
    // For each role (owner, admin, member, guest)
    for (const [role, permissions] of Object.entries(rolePermissions)) {
      // For each permission in the role
      for (const permission of permissions) {
        try {
          await db.execute(sql`
            INSERT INTO role_permissions (role, resource, action, granted)
            VALUES (${role}, ${permission.subject}, ${permission.action}, true)
          `);
          permissionsCreated++;
        } catch (error) {
          console.error(`Error creating permission for role ${role}, resource ${permission.subject}, action ${permission.action}:`, error);
        }
      }
    }
    
    console.log(`✅ Role permissions table created and populated with ${permissionsCreated} permissions`);
    
    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_role_permissions_resource_action ON role_permissions(resource, action);
    `);

  } catch (error) {
    console.error('❌ Role permissions table creation failed:', error);
    throw error;
  }
} 