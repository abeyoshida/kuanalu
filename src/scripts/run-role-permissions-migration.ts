import { createRolePermissionsTable } from '../lib/db/migrations/create-role-permissions-table';

/**
 * Script to create and populate the role_permissions table
 */
async function main() {
  try {
    console.log('Starting role permissions migration...');
    
    // Run the migration
    await createRolePermissionsTable();
    
    console.log('Role permissions migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running role permissions migration:', error);
    process.exit(1);
  }
}

// Execute the script
main(); 