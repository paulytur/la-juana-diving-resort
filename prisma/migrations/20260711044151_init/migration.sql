-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Booking" (
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
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomType_slug_key" ON "RoomType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
