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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        <UserProfileForm user={userDetails} />
      </div>
    </div>
  );
} 