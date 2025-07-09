import { db } from "@/lib/db";
import { hasPermission } from "@/lib/auth/server-permissions";
import { users, organizationMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function testPermissionCheck() {
  try {
    console.log("Testing permission checking logic...");
    
    // Find a member user in an organization
    const memberRecord = await db
      .select({
        userId: organizationMembers.userId,
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role
      })
      .from(organizationMembers)
      .where(eq(organizationMembers.role, "member"))
      .limit(1);
    
    if (!memberRecord.length) {
      console.log("No member users found in the database");
      return;
    }
    
    const { userId, organizationId, role } = memberRecord[0];
    
    // Get user details
    const user = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(results => results[0]);
    
    console.log(`Testing with user: ${user.name} (${user.email})`);
    console.log(`Role: ${role}`);
    console.log(`Organization ID: ${organizationId}`);
    console.log();
    
    // Test specific permissions
    const testCases = [
      { action: "read", subject: "subtask" },
      { action: "update", subject: "subtask" },
      { action: "create", subject: "subtask" },
      { action: "delete", subject: "subtask" },
      { action: "read", subject: "comment" },
      { action: "update", subject: "comment" },
      { action: "create", subject: "comment" },
      { action: "delete", subject: "comment" }
    ];
    
    for (const { action, subject } of testCases) {
      const hasAccess = await hasPermission(userId, organizationId, action, subject);
      
      console.log(`Permission check for ${action} ${subject}:`);
      console.log(`  Result: ${hasAccess ? "GRANTED" : "DENIED"}`);
    }
    
  } catch (error) {
    console.error("Error testing permission check:", error);
  } finally {
    process.exit(0);
  }
}

// Run the function
testPermissionCheck(); 