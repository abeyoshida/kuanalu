import { db } from "@/lib/db";
import { rolePermissions as rolePermissionsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function addMissingMemberPermissions() {
  try {
    console.log("Adding missing permissions for member role...");
    
    // Define the permissions that should exist for the member role
    const requiredPermissions = [
      // Organization permissions
      { role: "member", resource: "organization", action: "read" },
      
      // Project permissions
      { role: "member", resource: "project", action: "read" },
      
      // Task permissions
      { role: "member", resource: "task", action: "create" },
      { role: "member", resource: "task", action: "read" },
      { role: "member", resource: "task", action: "update" },
      
      // Subtask permissions
      { role: "member", resource: "subtask", action: "create" },
      { role: "member", resource: "subtask", action: "read" },
      { role: "member", resource: "subtask", action: "update" },
      
      // Comment permissions
      { role: "member", resource: "comment", action: "create" },
      { role: "member", resource: "comment", action: "read" },
      { role: "member", resource: "comment", action: "update" }
    ];
    
    // Get existing permissions for the member role
    const existingPermissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(eq(rolePermissionsTable.role, "member"));
    
    console.log(`Found ${existingPermissions.length} existing permissions for member role`);
    
    // Find missing permissions
    const missingPermissions = [];
    
    for (const perm of requiredPermissions) {
      const exists = existingPermissions.some(
        existingPerm => 
          existingPerm.resource === perm.resource && 
          existingPerm.action === perm.action
      );
      
      if (!exists) {
        missingPermissions.push({
          ...perm,
          granted: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    console.log(`Found ${missingPermissions.length} missing permissions to add`);
    
    if (missingPermissions.length > 0) {
      // Insert missing permissions one by one to avoid batch errors
      for (const perm of missingPermissions) {
        try {
          console.log(`Adding permission: ${perm.role} - ${perm.action} ${perm.resource}`);
          
          await db.insert(rolePermissionsTable).values(perm);
        } catch (error) {
          console.error(`Error adding permission ${perm.action} ${perm.resource}:`, error);
        }
      }
      
      console.log("Finished adding missing permissions");
    } else {
      console.log("No missing permissions to add");
    }
    
    // Verify the permissions after adding
    const finalPermissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(eq(rolePermissionsTable.role, "member"));
    
    console.log(`Member role now has ${finalPermissions.length} permissions:`);
    
    // Group by resource for better readability
    const groupedPermissions: Record<string, string[]> = {};
    
    finalPermissions.forEach(perm => {
      if (!groupedPermissions[perm.resource]) {
        groupedPermissions[perm.resource] = [];
      }
      groupedPermissions[perm.resource].push(perm.action);
    });
    
    // Print the grouped permissions
    for (const [resource, actions] of Object.entries(groupedPermissions)) {
      console.log(`- ${resource}: ${actions.join(', ')}`);
    }
    
  } catch (error) {
    console.error("Error managing permissions:", error);
  } finally {
    process.exit(0);
  }
}

// Run the function
addMissingMemberPermissions(); 