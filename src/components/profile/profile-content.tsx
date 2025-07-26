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
  const { setTitle, setEntityName } = useHeader();

  // Set the header title when the component mounts
  useEffect(() => {
    setTitle("Profile");
    setEntityName(null);
    
    // Clean up when unmounting
    return () => {
      setTitle("Dashboard");
      setEntityName(null);
    };
  }, [setTitle, setEntityName]);

  return (
    <div className="space-y-6">
      <UserProfileForm user={user} />
    </div>
  );
} 