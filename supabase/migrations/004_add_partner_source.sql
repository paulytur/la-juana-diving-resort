-- Track which partner site referred a booking
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "partnerSource" TEXT;
