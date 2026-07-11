import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminSession } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div>
      <p className="section-eyebrow">Staff access</p>
      <h1 className="mt-1 text-3xl font-bold text-brand-blue">Sign in</h1>
      <p className="mt-2 text-muted">
        Manage bookings, room availability, and resort content.
      </p>
      <div className="surface-card mt-6 rounded-2xl p-6 shadow-lg">
        <AdminLoginForm />
      </div>
    </div>
  );
}
