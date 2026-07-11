"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms" },
  { href: "/book", label: "Book" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-brand-blue"
      >
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-line bg-white px-4 py-4 shadow-lg">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-brand-blue hover:bg-brand-blue-light"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 justify-center py-3 text-sm"
            >
              Book Now
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
