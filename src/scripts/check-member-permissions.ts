import { db } from "@/lib/db";
import { rolePermissions as rolePermissionsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { rolePermissions } from "@/lib/auth/permissions-data";

async function checkMemberPermissions() {
  try {
    console.log("Checking member role permissions in the database...");
    
    // Get all permissions for the member role from the database
    const dbPermissions = await db
      .select()
      .from(rolePermissionsTable)
      .where(eq(rolePermissionsTable.role, "member"));
    
    console.log(`Found ${dbPermissions.length} permissions for the member role in the database:`);
    
    // Group by subject for better readability
    const groupedPermissions: Record<string, string[]> = {};
    
    dbPermissions.forEach(perm => {
      if (!groupedPermissions[perm.resource]) {
        groupedPermissions[perm.resource] = [];
      }
      groupedPermissions[perm.resource].push(perm.action);
    });
    
    // Print the grouped permissions
    for (const [subject, actions] of Object.entries(groupedPermissions)) {
      console.log(`- ${subject}: ${actions.join(', ')}`);
    }
    
    // Compare with what should be in the code
    console.log("\nComparing with permissions defined in code:");
    
    const codePermissions = rolePermissions.member;
    console.log(`Code defines ${codePermissions.length} permissions for the member role`);
    
    // Group by subject
    const groupedCodePermissions: Record<string, string[]> = {};
    
    codePermissions.forEach(perm => {
      if (!groupedCodePermissions[perm.subject]) {
        groupedCodePermissions[perm.subject] = [];
      }
      groupedCodePermissions[perm.subject].push(perm.action);
    });
    
    // Print the grouped code permissions
    for (const [subject, actions] of Object.entries(groupedCodePermissions)) {
      console.log(`- ${subject}: ${actions.join(', ')}`);
    }
    
    // Find missing permissions
    console.log("\nChecking for missing permissions in the database:");
    
    const missingPermissions = [];
    
    for (const perm of codePermissions) {
      const found = dbPermissions.some(
        dbPerm => dbPerm.resource === perm.subject && dbPerm.action === perm.action
      );
      
      if (!found) {
        missingPermissions.push(perm);
      }
    }
    
    if (missingPermissions.length === 0) {
      console.log("All permissions from code are present in the database!");
    } else {
      console.log(`Found ${missingPermissions.length} missing permissions:`);
      
      for (const perm of missingPermissions) {
        console.log(`- ${perm.action} ${perm.subject}`);
      }
      
      // Ask if we should add the missing permissions
      console.log("\nWould you like to add these missing permissions? (Run with --fix to add them)");
      
      // If --fix flag is provided, add the missing permissions
      if (process.argv.includes("--fix")) {
        console.log("Adding missing permissions...");
        
        const permissionsToInsert = missingPermissions.map(perm => ({
          role: "member",
          resource: perm.subject,
          action: perm.action,
          granted: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        if (permissionsToInsert.length > 0) {
          await db.insert(rolePermissionsTable).values(permissionsToInsert);
          console.log(`Successfully added ${permissionsToInsert.length} missing permissions`);
        }
      }
    }
    
  } catch (error) {
    console.error("Error checking member permissions:", error);
  } finally {
    process.exit(0);
  }
}

// Run the check function
checkMemberPermissions(); 