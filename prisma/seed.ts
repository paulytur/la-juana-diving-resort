import "dotenv/config";
import bcrypt from "bcryptjs";
import { createPrismaClient } from "../src/lib/prisma";
import { getPublicStorageUrl } from "../src/lib/supabase";

const prisma = createPrismaClient();

function imageUrl(folder: "rooms" | "facilities", filename: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    return getPublicStorageUrl(`${folder}/${filename}`);
  }
  return `/images/${folder}/${filename}`;
}

const ROOMS = [
  {
    slug: "marrakkesh",
    name: "Marrakkesh",
    description: "Family room perfect for larger groups",
    capacityMin: 3,
    capacityMax: 5,
    beds: "2 Queen Beds, 1 Single Bed",
    pricePerNight: 7000,
    pricePerPerson: false,
    inventory: 1,
    imageUrl: imageUrl("rooms", "marrakkesh.jpg"),
    sortOrder: 1,
  },
  {
    slug: "hiraya",
    name: "Hiraya",
    description: "Comfortable room for small groups",
    capacityMin: 3,
    capacityMax: 4,
    beds: "2 Single Beds, 1 Standard Double",
    pricePerNight: 6000,
    pricePerPerson: false,
    inventory: 1,
    imageUrl: imageUrl("rooms", "hiraya.jpg"),
    sortOrder: 2,
  },
  {
    slug: "oia",
    name: "Oia",
    description: "Cozy retreat for friends and families",
    capacityMin: 3,
    capacityMax: 4,
    beds: "2 Single Beds, 1 Standard Double",
    pricePerNight: 6000,
    pricePerPerson: false,
    inventory: 1,
    imageUrl: imageUrl("rooms", "oia.jpg"),
    sortOrder: 3,
  },
  {
    slug: "paraw",
    name: "Paraw",
    description: "Ideal for a trio getaway",
    capacityMin: 2,
    capacityMax: 3,
    beds: "1 Standard Double, 1 Single Bed",
    pricePerNight: 4750,
    pricePerPerson: false,
    inventory: 1,
    imageUrl: imageUrl("rooms", "paraw.jpg"),
    sortOrder: 4,
  },
  {
    slug: "casablanca",
    name: "Casablanca",
    description: "Intimate room for couples or solo travelers",
    capacityMin: 1,
    capacityMax: 2,
    beds: "1 Standard Double",
    pricePerNight: 2700,
    pricePerPerson: false,
    inventory: 1,
    imageUrl: imageUrl("rooms", "casablanca.jpg"),
    sortOrder: 5,
  },
  {
    slug: "mix-dormitory",
    name: "Mix Dormitory",
    description: "Shared room — priced per person per night",
    capacityMin: 1,
    capacityMax: 6,
    beds: "6 Single Beds",
    pricePerNight: 1350,
    pricePerPerson: true,
    inventory: 6,
    imageUrl: imageUrl("rooms", "mix-dormitory.jpg"),
    sortOrder: 6,
  },
];

const FACILITIES = [
  {
    slug: "beach-deck",
    name: "Ocean View Deck",
    description:
      "Relax on our open-air deck with colorful loungers and panoramic views of the bay.",
    imageUrl: imageUrl("facilities", "beach-deck.jpg"),
    sortOrder: 1,
  },
  {
    slug: "freediving",
    name: "Freediving",
    description:
      "Explore the underwater world with guided freediving experiences for all levels.",
    imageUrl: imageUrl("facilities", "freediving.jpg"),
    sortOrder: 2,
  },
  {
    slug: "resort-lounge",
    name: "Resort Lounge",
    description:
      "Spacious common areas designed for groups to unwind, socialize, and enjoy the breeze.",
    imageUrl: imageUrl("facilities", "resort-lounge.jpg"),
    sortOrder: 3,
  },
  {
    slug: "dining",
    name: "Dine-in Area",
    description:
      "Walk-in dining available — enjoy meals with sunset beach views.",
    imageUrl: imageUrl("facilities", "dining.jpg"),
    sortOrder: 4,
  },
  {
    slug: "sunset-view",
    name: "Sunset Views",
    description:
      "Watch the sky turn golden over Balagbag while boats drift across the water.",
    imageUrl: imageUrl("facilities", "sunset-view.jpg"),
    sortOrder: 5,
  },
  {
    slug: "diving",
    name: "Diving Adventures",
    description:
      "Scuba and freediving trips around Mabini — one of the Philippines' top dive destinations.",
    imageUrl: imageUrl("facilities", "diving.jpg"),
    sortOrder: 6,
  },
];

async function main() {
  for (const room of ROOMS) {
    await prisma.roomType.upsert({
      where: { slug: room.slug },
      update: room,
      create: room,
    });
  }

  for (const facility of FACILITIES) {
    await prisma.facility.upsert({
      where: { slug: facility.slug },
      update: facility,
      create: facility,
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@lajuana.ops";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const adminName = process.env.ADMIN_NAME ?? "Resort Admin";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      name: adminName,
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
    },
  });

  console.log("Seeded room types, facilities, and admin user.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
