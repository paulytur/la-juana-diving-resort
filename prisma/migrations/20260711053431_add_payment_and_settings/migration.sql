-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "roomTypeId" TEXT NOT NULL,
    "checkIn" DATETIME NOT NULL,
    "checkOut" DATETIME NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("adminNotes", "checkIn", "checkOut", "createdAt", "dayTourFee", "dayTourGuests", "guestEmail", "guestName", "guestPhone", "guests", "id", "nights", "petFee", "pets", "reference", "roomTypeId", "specialRequests", "status", "subtotal", "totalAmount", "updatedAt") SELECT "adminNotes", "checkIn", "checkOut", "createdAt", "dayTourFee", "dayTourGuests", "guestEmail", "guestName", "guestPhone", "guests", "id", "nights", "petFee", "pets", "reference", "roomTypeId", "specialRequests", "status", "subtotal", "totalAmount", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
