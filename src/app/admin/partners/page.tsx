import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminPartnersManager } from "@/components/admin-partners-manager";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Integrations"
        title="Partner websites"
        description="Create API keys for partner sites that list La Juana. Their bookings are tagged with the partner slug."
      />
      <AdminPartnersManager partners={partners} />
    </div>
  );
}
