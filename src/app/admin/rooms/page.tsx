import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminRoomsManager } from "@/components/admin-rooms-manager";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminRoomsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const rooms = await prisma.roomType.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          bookings: {
            where: { status: { in: ["PENDING", "CONFIRMED"] } },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Inventory"
        title="Rooms"
        description="Add room types or pick one from the list to edit rates, photos, and availability."
      />
      <AdminRoomsManager rooms={rooms} />
    </div>
  );
}
