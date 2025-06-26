import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import AppLayout from "@/components/dashboard/client-dashboard-layout";

interface OrganizationLayoutProps {
  children: React.ReactNode;
  params: {
    id: string;
  };
}

export default async function OrganizationLayout({ children, params }: OrganizationLayoutProps) {
  const session = await auth();
  const userName = session?.user?.name || "User";
  
  const organizationId = parseInt(params.id);
  
  if (isNaN(organizationId)) {
    return notFound();
  }
  
  // Fetch organization details
  const organization = await db
    .select({
      id: organizations.id,
      name: organizations.name,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)
    .then(results => results[0] || null);
  
  if (!organization) {
    return notFound();
  }
  
  return (
    <AppLayout userName={userName} title={organization.name}>
      {children}
    </AppLayout>
  );
} 