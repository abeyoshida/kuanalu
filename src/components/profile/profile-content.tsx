"use client";

import { UserProfileForm } from "@/components/auth/user-profile-form";
import { users } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";

type User = InferSelectModel<typeof users>;

interface ProfileContentProps {
  user: User;
}

export default function ProfileContent({ user }: ProfileContentProps) {
  return (
    <div className="space-y-6">
      <UserProfileForm user={user} />
    </div>
  );
} 