import { z } from "zod";

export const bookingSchema = z
  .object({
    roomTypeId: z.string().min(1).optional(),
    rooms: z
      .array(
        z.object({
          roomTypeId: z.string().min(1),
          quantity: z.coerce.number().int().min(1).max(10),
        }),
      )
      .optional(),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guests: z.coerce.number().int().min(1).max(20),
    guestName: z.string().min(2).max(100),
    guestEmail: z.string().email(),
    guestPhone: z.string().min(7).max(30),
    specialRequests: z.string().max(500).optional(),
    pets: z.coerce.number().int().min(0).max(5).default(0),
    dayTourGuests: z.coerce.number().int().min(0).max(20).default(0),
    paymentReference: z.string().min(2).max(100).optional(),
    paymentProofUrl: z.string().min(1).max(500),
    partnerSource: z.string().max(80).optional(),
  })
  .refine((data) => Boolean(data.roomTypeId || (data.rooms && data.rooms.length > 0)), {
    message: "roomTypeId or rooms is required",
  });

export const paymentSettingsSchema = z.object({
  qrImageUrl: z.string().max(500),
  accountName: z.string().max(120),
  accountNumber: z.string().max(120),
  instructions: z.string().max(1000),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const bookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  adminNotes: z.string().max(1000).optional(),
});

export const adminBookingCreateSchema = z
  .object({
    roomTypeId: z.string().min(1).optional(),
    rooms: z
      .array(
        z.object({
          roomTypeId: z.string().min(1),
          quantity: z.coerce.number().int().min(1).max(10),
        }),
      )
      .optional(),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guests: z.coerce.number().int().min(1).max(20),
    guestName: z.string().min(2).max(100),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().min(7).max(30),
    specialRequests: z.string().max(500).optional(),
    pets: z.coerce.number().int().min(0).max(5).default(0),
    dayTourGuests: z.coerce.number().int().min(0).max(20).default(0),
    paymentReference: z.string().min(2).max(100).optional(),
    paymentProofUrl: z.string().min(1).max(500).optional(),
    adminNotes: z.string().max(1000).optional(),
    confirmImmediately: z.boolean().default(true),
  })
  .refine((data) => Boolean(data.roomTypeId || (data.rooms && data.rooms.length > 0)), {
    message: "roomTypeId or rooms is required",
  });

export const roomCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  beds: z.string().min(2).max(200),
  capacityMin: z.coerce.number().int().min(1).max(20),
  capacityMax: z.coerce.number().int().min(1).max(20),
  pricePerNight: z.coerce.number().int().min(0),
  pricePerPerson: z.boolean().optional(),
  inventory: z.coerce.number().int().min(0).max(100).optional(),
  imageUrl: z.string().max(500).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

export const roomUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  beds: z.string().min(2).max(200).optional(),
  capacityMin: z.coerce.number().int().min(1).max(20).optional(),
  capacityMax: z.coerce.number().int().min(1).max(20).optional(),
  pricePerNight: z.coerce.number().int().min(0).optional(),
  pricePerPerson: z.boolean().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  inventory: z.coerce.number().int().min(0).max(100).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

export const facilityCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(4).max(500),
  imageUrl: z.string().min(1).max(500),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

export const partnerBookingSchema = z
  .object({
    roomTypeId: z.string().min(1).optional(),
    roomSlug: z.string().min(1).optional(),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guests: z.coerce.number().int().min(1).max(20),
    guestName: z.string().min(2).max(100).optional(),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().min(7).max(30).optional(),
    specialRequests: z.string().max(500).optional(),
    pets: z.coerce.number().int().min(0).max(5).default(0),
    dayTourGuests: z.coerce.number().int().min(0).max(20).default(0),
    paymentReference: z.string().min(2).max(100).optional(),
    paymentProofUrl: z.string().min(1).max(500).optional(),
    partnerBookingReference: z.string().min(2).max(100).optional(),
  })
  .refine((data) => data.roomTypeId || data.roomSlug, {
    message: "roomTypeId or roomSlug is required",
  })
  .refine(
    (data) => {
      const paying = Boolean(data.paymentProofUrl);
      if (!paying) return true;
      return Boolean(data.guestName && data.guestEmail && data.guestPhone);
    },
    { message: "guestName, guestEmail, and guestPhone are required with payment" },
  );

export const bookingPaymentSchema = z.object({
  guestEmail: z.string().email(),
  paymentProofUrl: z.string().min(1).max(500),
  paymentReference: z.string().min(2).max(100).optional(),
});

export const partnerCreateSchema = z.object({
  name: z.string().min(2).max(100),
});

export const partnerUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  regenerateKey: z.boolean().optional(),
});

export const facilityUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(4).max(500).optional(),
  imageUrl: z.string().min(1).max(500).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});
