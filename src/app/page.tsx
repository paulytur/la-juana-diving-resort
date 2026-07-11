import Image from "next/image";
import Link from "next/link";
import { BookingHowTo } from "@/components/booking-how-to";
import { FacilityGallery } from "@/components/facility-gallery";
import { FloatingBookCta } from "@/components/floating-book-cta";
import { PageShell } from "@/components/page-shell";
import { RoomCard } from "@/components/room-card";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { AMENITIES, FEES, RESORT } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatPHP } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [rooms, facilities] = await Promise.all([
    prisma.roomType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
    prisma.facility.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <PageShell>
      <SiteHeader />
      <main>
        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="badge-pill">📍 Mabini, Batangas</span>
                <span className="badge-pill">🐾 Pet friendly</span>
                <span className="badge-pill">🤿 Diving resort</span>
              </div>
              <h1 className="section-title mt-6">Your home under the Sun</h1>
              <p className="section-lead mt-5 max-w-lg">
                Beachfront staycations, diving, and freediving — just a few
                clicks away from your next escape.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/book" className="btn-primary px-7 py-3.5">
                  Book your stay
                </Link>
                <Link href="/rooms" className="btn-secondary px-7 py-3.5">
                  Browse rooms
                </Link>
              </div>
              <p className="input-hint mt-5">
                Questions?{" "}
                <a
                  href={`tel:${RESORT.phone}`}
                  className="font-semibold text-brand-blue hover:underline"
                >
                  Get in touch
                </a>
              </p>
            </div>
            <div className="hero-panel flex justify-center">
              <Image
                src="/logo.png"
                alt={RESORT.name}
                width={400}
                height={200}
                className="relative z-10 w-full max-w-xs object-contain sm:max-w-sm"
                priority
              />
            </div>
          </div>
        </section>

        <section className="accent-band px-4 py-12 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
            {[
              { label: "Room types", value: "6", icon: "🏠" },
              { label: "Starting from", value: formatPHP(1350), icon: "✨" },
              { label: "Guest rating", value: "94% recommend", icon: "⭐" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-2"
              >
                <span className="text-2xl" aria-hidden>
                  {stat.icon}
                </span>
                <div>
                  <p className="section-eyebrow">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-brand-blue">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-line bg-brand-blue-light/30 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <BookingHowTo centered />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-eyebrow">Accommodation</p>
              <h2 className="section-title mt-2">Popular rooms</h2>
              <p className="section-lead mt-3 max-w-xl">
                All rooms include WiFi, A/C, hot shower, toiletries, and
                unlimited coffee.
              </p>
            </div>
            <Link
              href="/rooms"
              className="btn-secondary self-start px-5 py-2.5 text-sm sm:self-auto"
            >
              View all rooms
            </Link>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </section>

        <section className="border-t border-line px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <p className="section-eyebrow">Experience</p>
            <h2 className="section-title mt-2">Resort facilities</h2>
            <p className="section-lead mt-3 max-w-2xl">
              From ocean-view lounging to freediving adventures — everything you
              need for a memorable stay in Mabini.
            </p>
            <div className="mt-10">
              <FacilityGallery facilities={facilities} />
            </div>
          </div>
        </section>

        <section className="border-t border-line px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <p className="section-eyebrow">Every stay includes</p>
            <h2 className="section-title mt-2">Resort amenities</h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {AMENITIES.map((amenity) => (
                <li
                  key={amenity}
                  className="surface-card flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-yellow text-xs font-bold text-brand-blue">
                    ✓
                  </span>
                  {amenity}
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Day tour", value: formatPHP(FEES.dayTour) },
                { label: "Pet fee", value: `${formatPHP(FEES.pet)} / pet` },
                {
                  label: "Dining",
                  value: "Walk-in dine-in available",
                  large: true,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="surface-card rounded-2xl bg-brand-yellow-soft p-5"
                >
                  <p className="section-eyebrow">{item.label}</p>
                  <p
                    className={`mt-2 font-bold text-brand-blue ${item.large ? "text-base" : "text-2xl"}`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 pt-4 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-[2rem] bg-brand-blue px-8 py-12 text-center text-white sm:px-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to visit?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
              Book online in minutes, or message us directly if you have
              questions about group trips or diving packages.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/book"
                className="inline-flex rounded-full bg-white px-7 py-3 font-semibold text-brand-blue transition hover:bg-brand-yellow-soft"
              >
                Start booking
              </Link>
              <a
                href={`tel:${RESORT.phone}`}
                className="inline-flex rounded-full border border-white/40 px-7 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Call us
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingBookCta />
    </PageShell>
  );
}
