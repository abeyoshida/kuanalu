import { auth } from "@/lib/auth/auth";
import { UserProfileForm } from "@/components/auth/user-profile-form";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function ProfilePage() {
  // Get the session
  const session = await auth();
  
  // If no session, redirect to login
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/profile");
  }
  
  // Fetch user details from database
  const userId = parseInt(session.user.id);
  const userDetails = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(results => results[0]);
  
  if (!userDetails) {
    return <div>User not found</div>;
  }
  
  return (
    <>
      <UserProfileForm user={userDetails} />
    </>
  );
} 