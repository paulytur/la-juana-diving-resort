import { BookingForm } from "@/components/booking-form";
import { RESORT } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { parsePartnerSource } from "@/lib/partner";
import { getPaymentSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type EmbedBookPageProps = {
  searchParams: Promise<{
    room?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    partner?: string;
  }>;
};

export default async function EmbedBookPage({ searchParams }: EmbedBookPageProps) {
  const params = await searchParams;
  const partner = parsePartnerSource(params.partner);
  const guests = params.guests ? Number(params.guests) : undefined;

  const [rooms, paymentSettings] = await Promise.all([
    prisma.roomType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getPaymentSettings(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
            Book with {RESORT.name}
          </p>
          <p className="mt-1 text-sm text-muted">
            Secure your stay with a 50% downpayment.
          </p>
        </div>
        {partner && (
          <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-muted">
            Partner: {partner}
          </span>
        )}
      </div>

      <BookingForm
        rooms={rooms}
        initialRoomSlug={params.room}
        initialCheckIn={params.checkIn}
        initialCheckOut={params.checkOut}
        initialGuests={Number.isFinite(guests) && guests! >= 1 ? guests : undefined}
        partnerSource={partner}
        embedMode
        autoSearch={Boolean(params.checkIn && params.checkOut && guests)}
        paymentSettings={paymentSettings}
      />
    </main>
  );
}
