import Link from "next/link";
import { PartnerCheckoutForm } from "@/components/partner-checkout-form";
import { PageShell } from "@/components/page-shell";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { CheckoutError, getCheckoutContext } from "@/lib/checkout";
import { parsePartnerSource } from "@/lib/partner";
import { getPaymentSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  searchParams: Promise<{
    room?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    partner?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
  }>;
};

export default async function PartnerCheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const partner = parsePartnerSource(params.partner);
  const guests = Number(params.guests ?? "0");
  const paymentSettings = await getPaymentSettings();

  const missing =
    !params.room || !params.checkIn || !params.checkOut || !Number.isFinite(guests) || guests < 1;

  if (missing) {
    return (
      <PageShell>
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6">
          <h1 className="section-title">Missing booking details</h1>
          <p className="section-lead mt-4">
            A room, check-in, check-out, and guest count are required to pay.
          </p>
          <Link href="/book" className="btn-primary mt-8 inline-flex px-5 py-2.5">
            Book on La Juana
          </Link>
        </main>
        <SiteFooter />
      </PageShell>
    );
  }

  try {
    const checkout = await getCheckoutContext({
      roomSlug: params.room!,
      checkIn: params.checkIn!,
      checkOut: params.checkOut!,
      guests,
    });

    return (
      <PageShell>
        <SiteHeader />
        <main className="mobile-page mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14">
          <div className="mb-8 max-w-2xl">
            <p className="section-eyebrow">Secure your stay</p>
            <h1 className="section-title mt-2">Pay your downpayment</h1>
            <p className="section-lead mt-4">
              Complete your La Juana reservation with a 50% downpayment. Scan the QR,
              upload your receipt, and you&apos;re all set.
            </p>
          </div>

          <PartnerCheckoutForm
            checkout={checkout}
            partnerSource={partner}
            paymentSettings={paymentSettings}
            initialGuestName={params.guestName ?? ""}
            initialGuestEmail={params.guestEmail ?? ""}
            initialGuestPhone={params.guestPhone ?? ""}
          />
        </main>
        <SiteFooter />
      </PageShell>
    );
  } catch (error) {
    const message =
      error instanceof CheckoutError
        ? error.message
        : "Unable to load checkout for this room and dates.";

    return (
      <PageShell>
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6">
          <h1 className="section-title">Cannot proceed to payment</h1>
          <p className="section-lead mt-4">{message}</p>
          <Link href="/book" className="btn-primary mt-8 inline-flex px-5 py-2.5">
            Try another booking
          </Link>
        </main>
        <SiteFooter />
      </PageShell>
    );
  }
}
