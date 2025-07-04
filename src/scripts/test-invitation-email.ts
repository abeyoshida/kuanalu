import { db } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/email/send-invitation";
import { invitations } from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";

async function testInvitationEmail() {
  const testEmail = "abeyoshida@gmail.com";
  const organizationName = "Nordic Sakura LLC";
  const inviterName = "Abram";
  
  // Create a test invitation in the database
  const invitationToken = uuidv4();
  
  try {
    // Insert a test invitation record
    const invitation = await db.insert(invitations).values({
      email: testEmail,
      organizationId: 7, // Use a real org ID number for proper testing
      token: invitationToken,
      role: "member",
      status: "pending",
      invitedBy: 20, // Add a valid user ID here
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }).returning();
    
    console.log("Created test invitation:", invitation);
    
    // Send the invitation email
    const result = await sendInvitationEmail({
      inviteeEmail: testEmail,
      inviterName,
      organizationName,
      invitationToken,
      role: "member",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    
    console.log("Email sending result:", result);
    console.log("Email queued successfully!");
  } catch (error) {
    console.error("Error sending test invitation email:", error);
  }
}

// Run the test
testInvitationEmail()
  .then(() => console.log("Test completed"))
  .catch(console.error)
  .finally(() => process.exit()); 