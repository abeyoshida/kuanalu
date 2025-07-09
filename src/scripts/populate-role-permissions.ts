import { db } from "@/lib/db";
import { rolePermissions as rolePermissionsTable } from "@/lib/db/schema";
import { rolePermissions } from "@/lib/auth/permissions-data";
import { and, count, eq } from "drizzle-orm";

async function populateRolePermissions() {
  try {
    console.log("Starting to populate role_permissions table...");
    
    // Count existing permissions
    const existingCount = await db.select({ count: count() }).from(rolePermissionsTable);
    console.log(`Current permissions in database: ${existingCount[0].count}`);
    
    // Create an array to hold all permission records to insert
    const permissionsToInsert = [];
    
    // Iterate through each role and its permissions
    for (const [role, permissions] of Object.entries(rolePermissions)) {
      console.log(`Processing role: ${role} with ${permissions.length} permissions`);
      
      for (const permission of permissions) {
        // Check if this permission already exists
        const existingPermission = await db
          .select()
          .from(rolePermissionsTable)
          .where(
            and(
              eq(rolePermissionsTable.role, role),
              eq(rolePermissionsTable.resource, permission.subject),
              eq(rolePermissionsTable.action, permission.action)
            )
          );
        
        if (existingPermission.length === 0) {
          // Permission doesn't exist, add it to our insert array
          permissionsToInsert.push({
            role: role,
            resource: permission.subject,
            action: permission.action,
            granted: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
    
    console.log(`Found ${permissionsToInsert.length} new permissions to insert`);
    
    if (permissionsToInsert.length > 0) {
      // Insert all new permissions
      await db.insert(rolePermissionsTable).values(permissionsToInsert);
      console.log(`Successfully inserted ${permissionsToInsert.length} permissions`);
    } else {
      console.log("No new permissions to insert");
    }
    
    // Verify the total count after insertion
    const finalCount = await db.select({ count: count() }).from(rolePermissionsTable);
    console.log(`Final permissions in database: ${finalCount[0].count}`);
    
    console.log("Role permissions population completed successfully");
  } catch (error) {
    console.error("Error populating role permissions:", error);
  } finally {
    process.exit(0);
  }
}

// Run the population function
populateRolePermissions(); 