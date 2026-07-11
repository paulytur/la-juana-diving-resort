import Image from "next/image";
import type { Facility } from "@/generated/prisma/client";

type FacilityGalleryProps = {
  facilities: Pick<Facility, "id" | "name" | "description" | "imageUrl">[];
};

export function FacilityGallery({ facilities }: FacilityGalleryProps) {
  if (facilities.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {facilities.map((facility) => (
        <article
          key={facility.id}
          className="surface-card surface-card-hover group overflow-hidden rounded-2xl"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-brand-yellow-soft">
            <Image
              src={facility.imageUrl}
              alt={facility.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/70 via-brand-blue/10 to-transparent" />
            <h3 className="absolute bottom-4 left-4 right-4 text-lg font-bold text-white">
              {facility.name}
            </h3>
          </div>
          <p className="px-5 py-4 text-sm leading-relaxed text-muted">
            {facility.description}
          </p>
        </article>
      ))}
    </div>
  );
}
