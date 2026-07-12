-- Link multiple room bookings from one checkout (groups larger than 6 guests)
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "groupReference" TEXT;

CREATE INDEX IF NOT EXISTS "Booking_groupReference_idx"
  ON "Booking"("groupReference")
  WHERE "groupReference" IS NOT NULL;
