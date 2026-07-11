import Image from "next/image";
import Link from "next/link";
import { RESORT } from "@/lib/constants";
import { MobileNav } from "@/components/mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt={RESORT.name}
            width={120}
            height={48}
            className="h-9 w-auto object-contain sm:h-11"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-2 sm:flex">
          <Link
            href="/rooms"
            className="rounded-full px-4 py-2 text-sm font-medium text-brand-blue transition hover:bg-brand-blue-light"
          >
            Rooms
          </Link>
          <a
            href={`tel:${RESORT.phone}`}
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-brand-blue-light hover:text-brand-blue lg:inline"
          >
            Contact
          </a>
          <Link href="/book" className="btn-primary px-5 py-2.5 text-sm">
            Book Now
          </Link>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-brand-yellow-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Image
            src="/logo.png"
            alt={RESORT.name}
            width={140}
            height={56}
            className="h-12 w-auto object-contain"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {RESORT.description}
          </p>
          <Link href="/book" className="btn-primary mt-5 inline-flex text-sm">
            Reserve a room
          </Link>
        </div>
        <div>
          <h4 className="section-eyebrow">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-foreground">
            <li>{RESORT.address}</li>
            <li>
              <a
                href={`tel:${RESORT.phone}`}
                className="font-medium transition hover:text-brand-blue"
              >
                {RESORT.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${RESORT.email}`}
                className="transition hover:text-brand-blue"
              >
                {RESORT.email}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="section-eyebrow">Follow Us</h4>
          <ul className="mt-4 space-y-3 text-sm text-foreground">
            <li>
              <a
                href={RESORT.facebook}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-brand-blue"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href={RESORT.instagram}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-brand-blue"
              >
                Instagram
              </a>
            </li>
            <li className="text-muted">Pet friendly · Dine-in available</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-yellow px-4 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {RESORT.name}. All rights reserved.
      </div>
    </footer>
  );
}
