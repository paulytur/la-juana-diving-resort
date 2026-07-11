import { redirect } from "next/navigation";
import { AdminFacilitiesManager } from "@/components/admin-facilities-manager";
import { AdminPageHeader } from "@/components/admin-page-header";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminFacilitiesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const facilities = await prisma.facility.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Resort"
        title="Facilities"
        description="Pick a facility from the list to edit, or add a new one for the public gallery."
      />
      <AdminFacilitiesManager facilities={facilities} />
    </div>
  );
}
