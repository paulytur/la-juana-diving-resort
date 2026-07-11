export const ROOM_IMAGES: Record<string, string> = {
  marrakkesh: "/images/rooms/marrakkesh.jpg",
  hiraya: "/images/rooms/hiraya.jpg",
  oia: "/images/rooms/oia.jpg",
  paraw: "/images/rooms/paraw.jpg",
  casablanca: "/images/rooms/casablanca.jpg",
  "mix-dormitory": "/images/rooms/mix-dormitory.jpg",
};

export function getRoomImage(slug: string, imageUrl?: string | null) {
  return imageUrl ?? ROOM_IMAGES[slug] ?? "/images/rooms/oia.jpg";
}
