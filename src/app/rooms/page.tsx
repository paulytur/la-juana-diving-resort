import { FacilityGallery } from "@/components/facility-gallery";
import { FloatingBookCta } from "@/components/floating-book-cta";
import { PageShell } from "@/components/page-shell";
import { RoomCard } from "@/components/room-card";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { FEES, RESORT } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatPHP } from "@/lib/pricing";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const [rooms, facilities] = await Promise.all([
    prisma.roomType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.facility.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <PageShell>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="max-w-2xl">
          <p className="section-eyebrow">Rates & availability</p>
          <h1 className="section-title mt-2">Rooms & rates</h1>
          <p className="section-lead mt-4">
            Private rooms for couples and families, or a bed in our shared
            dormitory. Tap any room to start booking.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <span className="badge-pill">
            Day tour {formatPHP(FEES.dayTour)} / person
          </span>
          <span className="badge-pill">Pet fee {formatPHP(FEES.pet)} / pet</span>
          <span className="badge-pill">Standard amenities included</span>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>

        <section className="mt-16 border-t border-line pt-16">
          <p className="section-eyebrow">On-site</p>
          <h2 className="section-title mt-2">Resort facilities</h2>
          <p className="section-lead mt-3 max-w-2xl">
            Beyond your room — enjoy diving, dining, and sunset views throughout
            the property.
          </p>
          <div className="mt-10">
            <FacilityGallery facilities={facilities} />
          </div>
        </section>

        <div className="mt-12 rounded-2xl bg-brand-blue-light px-6 py-8 text-center sm:px-10">
          <p className="font-semibold text-brand-blue">Not sure which room?</p>
          <p className="input-hint mt-2">
            Call us and we&apos;ll help you pick the best fit.
          </p>
          <Link href="/book" className="btn-primary mt-5 inline-flex text-sm">
            Or start booking now
          </Link>
        </div>
      </main>
      <SiteFooter />
      <FloatingBookCta />
    </PageShell>
  );
}
