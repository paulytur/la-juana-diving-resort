"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/facilities", label: "Facilities" },
  { href: "/admin/settings", label: "Payment settings" },
] as const;

type AdminNavProps = {
  adminName: string;
};

function linkClass(active: boolean) {
  return cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
    active
      ? "bg-brand-blue text-white shadow-sm"
      : "text-ink hover:bg-brand-yellow-soft hover:text-brand-blue",
  );
}

export function AdminSidebar({ adminName }: AdminNavProps) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden min-h-screen flex-col border-r border-line bg-white px-4 py-6 lg:flex">
      <div className="border-b border-line px-2 pb-5">
        <Image
          src="/logo.png"
          alt="La Juana Diving Resort"
          width={120}
          height={48}
          className="h-9 w-auto object-contain"
        />
        <p className="section-eyebrow mt-4">Admin</p>
        <p className="mt-1 text-base font-bold text-brand-blue">Control panel</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 py-5" aria-label="Admin navigation">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, "exact" in item ? item.exact : false);
          return (
            <Link key={item.href} href={item.href} className={linkClass(active)}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-line px-2 pt-4">
        <p className="text-sm font-semibold text-brand-blue">{adminName}</p>
        <Link
          href="/"
          className="block text-sm font-medium text-muted transition hover:text-brand-blue"
        >
          View public site →
        </Link>
        <AdminLogoutButton />
      </div>
    </aside>
  );
}

export function AdminMobileNav({ adminName }: AdminNavProps) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="border-b border-line bg-white px-4 py-3 lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, "exact" in item ? item.exact : false);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                active
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "border-line text-ink hover:border-brand-blue hover:text-brand-blue",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">Signed in as {adminName}</p>
    </div>
  );
}
