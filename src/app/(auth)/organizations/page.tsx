import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getUserOrganizations } from "@/lib/actions/organization-actions";
import { Suspense } from "react";
import OrganizationsListContent from "@/components/organizations/organizations-list-content";

export const metadata = {
  title: "Organizations | Kuanalu",
  description: "Manage your organizations",
};

export default async function OrganizationsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/organizations");
  }
  
  const organizations = await getUserOrganizations();
  
  return (
    <Suspense fallback={<div>Loading organizations...</div>}>
      <OrganizationsListContent organizations={organizations} />
    </Suspense>
  );
} 