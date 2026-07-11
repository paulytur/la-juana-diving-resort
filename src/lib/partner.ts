import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/partner-client";

export { getSiteUrl };

export function generatePartnerApiKey() {
  return `lj_live_${randomBytes(24).toString("hex")}`;
}

export function extractPartnerApiKey(request: Request) {
  const header = request.headers.get("x-api-key");
  if (header) return header.trim();

  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  const { searchParams } = new URL(request.url);
  return searchParams.get("apiKey")?.trim() || null;
}

export async function getPartnerFromRequest(request: Request) {
  const apiKey = extractPartnerApiKey(request);
  if (!apiKey) return null;

  const partner = await prisma.partner.findUnique({ where: { apiKey } });
  return partner?.isActive ? partner : null;
}

export async function resolvePartnerSlug(slug: string | undefined) {
  if (!slug) return undefined;
  const partner = await prisma.partner.findUnique({ where: { slug } });
  return partner?.isActive ? partner.slug : undefined;
}

export type PartnerBookingParams = {
  partner?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  room?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
};

/** Partner slug allowed to use iframe embed (Immerseafy admin only). */
export function getPartnerEmbedSlug() {
  return (process.env.PARTNER_EMBED_SLUG ?? "immerseafy").trim().toLowerCase();
}

export function canPartnerUseEmbed(partnerSlug: string | null | undefined) {
  if (!partnerSlug) return false;
  return partnerSlug.trim().toLowerCase() === getPartnerEmbedSlug();
}

export function buildPartnerCheckoutUrl(params: PartnerBookingParams = {}) {
  const base = `${getSiteUrl()}/book/checkout`;
  const search = new URLSearchParams();

  if (params.partner) search.set("partner", params.partner);
  if (params.checkIn) search.set("checkIn", params.checkIn);
  if (params.checkOut) search.set("checkOut", params.checkOut);
  if (params.guests) search.set("guests", String(params.guests));
  if (params.room) search.set("room", params.room);
  if (params.guestName) search.set("guestName", params.guestName);
  if (params.guestEmail) search.set("guestEmail", params.guestEmail);
  if (params.guestPhone) search.set("guestPhone", params.guestPhone);

  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

export function buildPartnerPaymentUrl(
  reference: string,
  embed = false,
  partnerSlug?: string | null,
) {
  if (embed && canPartnerUseEmbed(partnerSlug)) {
    return `${getSiteUrl()}/embed/partner/pay/${reference}`;
  }
  return `${getSiteUrl()}/partner/pay/${reference}`;
}

/** @deprecated Use buildPartnerCheckoutUrl — partners go straight to payment. */
export function buildPartnerBookingUrl(params: PartnerBookingParams = {}) {
  return buildPartnerCheckoutUrl(params);
}

export function parsePartnerSource(value: string | null | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, 80);
  return /^[a-zA-Z0-9._-]+$/.test(trimmed) ? trimmed : undefined;
}

export function partnerCorsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = process.env.PARTNER_ALLOWED_ORIGINS?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const allowOrigin =
    allowed?.length && origin && allowed.includes(origin)
      ? origin
      : allowed?.length === 1 && allowed[0] === "*"
        ? "*"
        : origin ?? "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export function partnerUnauthorizedMessage() {
  return "A valid API key is required. Pass it as an x-api-key header, Bearer token, or apiKey query parameter.";
}
