import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type LegacyEmbedRedirectProps = {
  params: Promise<{ reference: string }>;
};

/** Legacy URL — always redirect to full payment page (no iframe for guests). */
export default async function EmbedPayRedirect({ params }: LegacyEmbedRedirectProps) {
  const { reference } = await params;
  redirect(`/partner/pay/${reference}`);
}
