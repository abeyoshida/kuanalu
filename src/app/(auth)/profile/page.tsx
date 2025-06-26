import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProfileContent from "@/components/profile/profile-content";

export const metadata = {
  title: "Profile | Kuanalu",
  description: "Manage your profile settings",
};

export default async function ProfilePage() {
  // Get the session
  const session = await auth();
  
  if (!session?.user) {
    return notFound();
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
    return notFound();
  }
  
  return <ProfileContent user={userDetails} />;
} 