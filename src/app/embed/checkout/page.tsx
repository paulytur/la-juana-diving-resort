import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type EmbedCheckoutRedirectProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/** Legacy embed checkout URL — redirect to full La Juana checkout page. */
export default async function EmbedCheckoutRedirect({
  searchParams,
}: EmbedCheckoutRedirectProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const qs = query.toString();
  redirect(qs ? `/book/checkout?${qs}` : "/book/checkout");
}
