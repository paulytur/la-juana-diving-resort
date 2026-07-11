import Image from "next/image";
import Link from "next/link";
import { AdminMobileNav, AdminSidebar } from "@/components/admin-sidebar";
import { getAdminSession } from "@/lib/auth";
import { RESORT } from "@/lib/constants";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-b from-white to-brand-yellow-soft px-4 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-6 inline-flex">
            <Image
              src="/logo.png"
              alt={RESORT.name}
              width={140}
              height={56}
              className="h-10 w-auto object-contain"
            />
          </Link>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen bg-[#f8fafc] lg:grid-cols-[17rem_1fr]">
      <AdminSidebar adminName={session.name} />
      <div className="min-w-0">
        <AdminMobileNav adminName={session.name} />
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
