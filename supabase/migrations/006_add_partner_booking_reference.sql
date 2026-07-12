-- Partner's own booking reference (e.g. Immerseafy IMF-* id) for status sync
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "partnerBookingReference" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Booking_partnerSource_partnerBookingReference_key"
  ON "Booking"("partnerSource", "partnerBookingReference")
  WHERE "partnerBookingReference" IS NOT NULL;
