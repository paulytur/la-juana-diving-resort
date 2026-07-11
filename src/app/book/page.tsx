import { BookingForm } from "@/components/booking-form";
import { BookingHowTo } from "@/components/booking-how-to";
import { PageShell } from "@/components/page-shell";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { RESORT } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { getPaymentSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type BookPageProps = {
  searchParams: Promise<{ room?: string }>;
};

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const [rooms, paymentSettings] = await Promise.all([
    prisma.roomType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getPaymentSettings(),
  ]);

  return (
    <PageShell>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="mb-8 max-w-2xl">
          <p className="section-eyebrow">Reservations</p>
          <h1 className="section-title mt-2">Book your stay</h1>
          <p className="section-lead mt-4">
            Pick your dates, choose from available rooms, and secure your
            reservation with a 50% downpayment.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-line bg-brand-yellow-soft/60 p-5 sm:p-6">
          <BookingHowTo compact />
        </div>

        <BookingForm
          rooms={rooms}
          initialRoomSlug={params.room}
          paymentSettings={paymentSettings}
        />

        <p className="input-hint mt-8 text-center">
          Prefer to talk to someone?{" "}
          <a
            href={`tel:${RESORT.phone}`}
            className="font-semibold text-brand-blue hover:underline"
          >
            Call us
          </a>
        </p>
      </main>
      <SiteFooter />
    </PageShell>
  );
}
