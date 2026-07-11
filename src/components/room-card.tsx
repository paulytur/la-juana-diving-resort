import Image from "next/image";
import Link from "next/link";
import type { RoomType } from "@/generated/prisma/client";
import { AMENITIES } from "@/lib/constants";
import { getRoomImage } from "@/lib/images";
import { formatPHP } from "@/lib/pricing";

type RoomCardProps = {
  room: RoomType;
  showBookButton?: boolean;
};

export function RoomCard({ room, showBookButton = true }: RoomCardProps) {
  const priceLabel = room.pricePerPerson
    ? `${formatPHP(room.pricePerNight)} / person / night`
    : `${formatPHP(room.pricePerNight)} / night`;

  const capacityLabel =
    room.capacityMin === room.capacityMax
      ? `${room.capacityMax} guests`
      : `${room.capacityMin}–${room.capacityMax} guests`;

  const imageSrc = getRoomImage(room.slug, room.imageUrl);

  return (
    <article className="surface-card surface-card-hover group flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-yellow-soft">
        <Image
          src={imageSrc}
          alt={`${room.name} at La Juana Diving Resort`}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        <p className="absolute bottom-3 right-3 rounded-full bg-brand-yellow px-3 py-1 text-xs font-bold text-brand-blue shadow-sm">
          {priceLabel}
        </p>
      </div>

      <div className="flex flex-1 flex-col space-y-4 px-6 py-5">
        <div>
          <h3 className="text-xl font-bold text-brand-blue">{room.name}</h3>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted">
            <span aria-hidden>👥</span> {capacityLabel}
          </p>
        </div>
        <p className="text-sm text-foreground">
          <span className="font-semibold text-brand-blue">Beds:</span> {room.beds}
        </p>
        {room.description && (
          <p className="text-sm leading-relaxed text-muted">{room.description}</p>
        )}
        <ul className="grid grid-cols-2 gap-2 text-xs text-muted">
          {AMENITIES.slice(0, 4).map((amenity) => (
            <li key={amenity} className="flex items-center gap-1.5">
              <span className="font-bold text-brand-blue">✓</span>
              {amenity}
            </li>
          ))}
        </ul>
        {showBookButton && (
          <Link
            href={`/book?room=${room.slug}`}
            className="btn-primary mt-auto inline-flex w-full justify-center px-5 py-2.5 text-sm sm:w-auto"
          >
            Book {room.name}
          </Link>
        )}
      </div>
    </article>
  );
}
