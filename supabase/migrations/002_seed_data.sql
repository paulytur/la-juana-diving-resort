-- Seed room types, facilities, and admin user for La Juana Diving Resort
-- Image URLs point to Supabase Storage (run: npm run supabase:upload-images)

INSERT INTO "RoomType" (
  "id", "slug", "name", "description", "capacityMin", "capacityMax", "beds",
  "pricePerNight", "pricePerPerson", "inventory", "imageUrl", "sortOrder", "isActive", "updatedAt"
) VALUES
  (
    'seed_room_marrakkesh', 'marrakkesh', 'Marrakkesh', 'Family room perfect for larger groups',
    3, 5, '2 Queen Beds, 1 Single Bed', 7000, false, 1,
    'https://dpczvvquimpqmagylbnw.supabase.co/storage/v1/object/public/uploads/rooms/marrakkesh.jpg',
    1, true, NOW()
  ),
  (
    'seed_room_hiraya', 'hiraya', 'Hiraya', 'Comfortable room for small groups',
    3, 4, '2 Single Beds, 1 Standard Double', 6000, false, 1,
    'https://dpczvvquimpqmagylbnw.supabase.co/storage/v1/object/public/uploads/rooms/hiraya.jpg',
    2, true, NOW()
  ),
  (
    'seed_room_oia', 'oia', 'Oia', 'Cozy retreat for friends and families',
    3, 4, '2 Single Beds, 1 Standard Double', 6000, false, 1,
    'https://dpczvvquimpqmagylbnw.supabase.co/storage/v1/object/public/uploads/rooms/oia.jpg',
    3, true, NOW()
  ),
  (
    'seed_room_paraw', 'paraw', 'Paraw', 'Ideal for a trio getaway',
    2, 3, '1 Standard Double, 1 Single Bed', 4750, false, 1,
    'https://dpczvvquimpqmagylbnw.supabase.co/storage/v1/object/public/uploads/rooms/paraw.jpg',
    4, true, NOW()
  ),
  (
    'seed_room_casablanca', 'casablanca', 'Casablanca', 'Intimate room for couples or solo travelers',
    1, 2, '1 Standard Double', 2700, false, 1,
    'https://dpczvvquimpqmagylbnw.supabase.co/storage/v1/object/public/uploads/rooms/casablanca.jpg',
    5, true, NOW()
  ),
  (
    'seed_room_mix_dormitory', 'mix-dormitory', 'Mix Dormitory', 'Shared room — priced per person per night',
    1, 6, '6 Single Beds', 1350, true, 6,
    'https://dpczvvquimpqmagylbnw.supabase.co/storage/v1/object/public/uploads/rooms/mix-dormitory.jpg',
    6, true, NOW()
  )
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "capacityMin" = EXCLUDED."capacityMin",
  "capacityMax" = EXCLUDED."capacityMax",
  "beds" = EXCLUDED."beds",
  "pricePerNight" = EXCLUDED."pricePerNight",
  "pricePerPerson" = EXCLUDED."pricePerPerson",
  "inventory" = EXCLUDED."inventory",
  "imageUrl" = EXCLUDED."imageUrl",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

INSERT INTO "Facility" (
  "id", "slug", "name", "description", "imageUrl", "sortOrder", "isActive", "updatedAt"
) VALUES
  (
    'seed_facility_beach_deck', 'beach-deck', 'Ocean View Deck',
    'Relax on our open-air deck with colorful loungers and panoramic views of the bay.',
    'https://dpczvvquimpqmagylbnw.supabase.co/storage/v1/object/public/uploads/facilities/beach-deck.jpg',
    1, true, NOW()
  ),
  (
    'seed_facility_freediving', 'freediving', 'Freediving',
    'Explore the underwater world with guided freediving experiences for all levels.',
    'https://dpczvvquimpqmagylbnw.supabase.co/storage/v1/object/public/uploads/facilities/freediving.jpg',
    2, true, NOW()
  ),
  (
    'seed_facility_resort_lounge', 'resort-lounge', 'Resort Lounge',
    'Spacious common areas designed for groups to unwind, socialize, and enjoy the breeze.',
    'https://dpczvvquimpqmagylbnw.supabase.co/storage/v1/object/public/uploads/facilities/resort-lounge.jpg',
    3, true, NOW()
  ),
  (
    'seed_facility_dining', 'dining', 'Dine-in Area',
    'Walk-in dining available — enjoy meals with sunset beach views.',
    'https://dpczvvquimpqmagylbnw.supabase.co/storage/v1/object/public/uploads/facilities/dining.jpg',
    4, true, NOW()
  ),
  (
    'seed_facility_sunset_view', 'sunset-view', 'Sunset Views',
    'Watch the sky turn golden over Balagbag while boats drift across the water.',
    'https://dpczvvquimpqmagylbnw.supabase.co/storage/v1/object/public/uploads/facilities/sunset-view.jpg',
    5, true, NOW()
  ),
  (
    'seed_facility_diving', 'diving', 'Diving Adventures',
    'Scuba and freediving trips around Mabini — one of the Philippines'' top dive destinations.',
    'https://dpczvvquimpqmagylbnw.supabase.co/storage/v1/object/public/uploads/facilities/diving.jpg',
    6, true, NOW()
  )
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "imageUrl" = EXCLUDED."imageUrl",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

INSERT INTO "Admin" ("id", "email", "password", "name")
VALUES (
  'seed_admin_default',
  'admin@lajuana.ops',
  '$2b$10$68AkQKpy6Eyh7eqGfIdt2.cPbcj38L/JNqbT5Tqwk23N7kh0C5bVq',
  'Resort Admin'
)
ON CONFLICT ("email") DO UPDATE SET
  "password" = EXCLUDED."password",
  "name" = EXCLUDED."name";
