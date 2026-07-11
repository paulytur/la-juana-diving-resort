-- La Juana Diving Resort — initial Supabase schema
-- Run in Supabase SQL Editor, or use: npx prisma migrate deploy

CREATE TYPE "BookingStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED'
);

CREATE TABLE "RoomType" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "capacityMin" INTEGER NOT NULL,
  "capacityMax" INTEGER NOT NULL,
  "beds" TEXT NOT NULL,
  "pricePerNight" INTEGER NOT NULL,
  "pricePerPerson" BOOLEAN NOT NULL DEFAULT false,
  "inventory" INTEGER NOT NULL DEFAULT 1,
  "imageUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoomType_slug_key" ON "RoomType"("slug");

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "roomTypeId" TEXT NOT NULL,
  "checkIn" TIMESTAMP(3) NOT NULL,
  "checkOut" TIMESTAMP(3) NOT NULL,
  "guests" INTEGER NOT NULL,
  "guestName" TEXT NOT NULL,
  "guestEmail" TEXT NOT NULL,
  "guestPhone" TEXT NOT NULL,
  "specialRequests" TEXT,
  "pets" INTEGER NOT NULL DEFAULT 0,
  "dayTourGuests" INTEGER NOT NULL DEFAULT 0,
  "subtotal" INTEGER NOT NULL,
  "petFee" INTEGER NOT NULL DEFAULT 0,
  "dayTourFee" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" INTEGER NOT NULL,
  "nights" INTEGER NOT NULL,
  "depositAmount" INTEGER NOT NULL DEFAULT 0,
  "paymentReference" TEXT,
  "paymentProofUrl" TEXT,
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_roomTypeId_fkey"
  FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Admin" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

CREATE TABLE "Facility" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Facility_slug_key" ON "Facility"("slug");

CREATE TABLE "Setting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- Supabase Storage bucket for uploads (rooms, facilities, payment proofs, QR)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');
