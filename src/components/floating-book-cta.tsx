import Link from "next/link";

export function FloatingBookCta() {
  return (
    <Link href="/book" className="floating-cta btn-primary px-6 py-3 text-sm">
      Book your stay
    </Link>
  );
}
