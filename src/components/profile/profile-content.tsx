"use client";

import { useEffect } from "react";
import { UserProfileForm } from "@/components/auth/user-profile-form";
import { users } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { useHeader } from "@/components/layout/header-context";

type User = InferSelectModel<typeof users>;

interface ProfileContentProps {
  user: User;
}

export default function ProfileContent({ user }: ProfileContentProps) {
  const { setEntityName } = useHeader();

  // Set the user name in the header when the component mounts
  useEffect(() => {
    setEntityName(user.name || "Profile");
    
    // Clean up when unmounting
    return () => setEntityName(null);
  }, [user.name, setEntityName]);

  return (
    <div className="space-y-6">
      <UserProfileForm user={user} />
    </div>
  );
} 