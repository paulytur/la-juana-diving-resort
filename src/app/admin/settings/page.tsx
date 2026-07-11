import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminSettingsManager } from "@/components/admin-settings-manager";
import { getAdminSession } from "@/lib/auth";
import { getPaymentSettings } from "@/lib/settings";

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const settings = await getPaymentSettings();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Configuration"
        title="Payment settings"
        description="Upload the QR code guests use to pay their downpayment and set your account details."
      />
      <AdminSettingsManager initialSettings={settings} />
    </div>
  );
}
