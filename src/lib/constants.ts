export const RESORT = {
  name: "La Juana Diving Resort",
  tagline: "Your home under the Sun",
  description:
    "Beach resort in Mabini offering accommodation for group staycations, diving, and freediving adventures.",
  address: "Sitio Balagbag, Brgy. Bagalangit, Mabini, Batangas, Philippines",
  phone: "+63 952 483 4271",
  email: "lajuana.ops@gmail.com",
  facebook: "https://www.facebook.com/LaJuanaDivingResort",
  instagram: "https://www.instagram.com/LaJuanaDivingResort",
} as const;

export const AMENITIES = [
  "Bath Towel",
  "Basic Toiletries",
  "Free WiFi",
  "Hot & Cold Shower",
  "Air Conditioning",
  "Unlimited Coffee",
] as const;

export const FEES = {
  dayTour: 500,
  pet: 500,
} as const;

export const DEPOSIT_RATE = 0.5;

export const BOOKING_STATUS_LABELS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
} as const;
