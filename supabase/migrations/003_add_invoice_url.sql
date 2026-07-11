-- Add invoice URL for confirmed booking PDFs
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "invoiceUrl" TEXT;
