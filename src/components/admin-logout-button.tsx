"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-brand-blue transition hover:border-brand-yellow hover:bg-brand-yellow-soft"
    >
      Sign out
    </button>
  );
}
