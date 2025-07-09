import { db } from "@/lib/db";
import { rolePermissions as rolePermissionsTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

async function testSubtaskPermissions() {
  try {
    console.log("Testing subtask permissions for member role...");
    
    // Test specific permissions
    const testCases = [
      { role: "member", resource: "subtask", action: "read" },
      { role: "member", resource: "subtask", action: "update" },
      { role: "member", resource: "comment", action: "read" },
      { role: "member", resource: "comment", action: "update" },
      { role: "member", resource: "comment", action: "create" }
    ];
    
    for (const testCase of testCases) {
      const { role, resource, action } = testCase;
      
      // Direct database query
      const permissionRecord = await db
        .select()
        .from(rolePermissionsTable)
        .where(
          and(
            eq(rolePermissionsTable.role, role),
            eq(rolePermissionsTable.resource, resource),
            eq(rolePermissionsTable.action, action)
          )
        );
      
      console.log(`Permission check for ${role} - ${action} ${resource}:`);
      console.log(`  Found ${permissionRecord.length} records`);
      
      if (permissionRecord.length > 0) {
        console.log(`  ID: ${permissionRecord[0].id}`);
        console.log(`  Granted: ${permissionRecord[0].granted}`);
        console.log(`  Created at: ${permissionRecord[0].createdAt}`);
      } else {
        console.log(`  No permission record found!`);
      }
      
      console.log();
    }
    
  } catch (error) {
    console.error("Error testing permissions:", error);
  } finally {
    process.exit(0);
  }
}

// Run the function
testSubtaskPermissions(); 