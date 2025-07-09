import { db } from "@/lib/db";
import { rolePermissions as rolePermissionsTable } from "@/lib/db/schema";

async function checkRolePermissions() {
  try {
    console.log("Checking role_permissions table...");
    
    // Get all permissions
    const allPermissions = await db
      .select()
      .from(rolePermissionsTable);
    
    console.log(`Found ${allPermissions.length} total permissions in the database`);
    
    // Group by role
    const permissionsByRole: Record<string, any[]> = {};
    
    allPermissions.forEach(perm => {
      if (!permissionsByRole[perm.role]) {
        permissionsByRole[perm.role] = [];
      }
      permissionsByRole[perm.role].push(perm);
    });
    
    // Print permissions by role
    for (const [role, permissions] of Object.entries(permissionsByRole)) {
      console.log(`\nRole: ${role} (${permissions.length} permissions)`);
      
      // Group by resource for better readability
      const groupedPermissions: Record<string, string[]> = {};
      
      permissions.forEach(perm => {
        if (!groupedPermissions[perm.resource]) {
          groupedPermissions[perm.resource] = [];
        }
        groupedPermissions[perm.resource].push(perm.action);
      });
      
      // Print the grouped permissions
      for (const [resource, actions] of Object.entries(groupedPermissions)) {
        console.log(`- ${resource}: ${actions.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error("Error checking role permissions:", error);
  } finally {
    process.exit(0);
  }
}

// Run the function
checkRolePermissions(); 