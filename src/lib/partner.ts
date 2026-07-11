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
  embed?: boolean;
};

export function buildPartnerBookingUrl(params: PartnerBookingParams = {}) {
  const base = params.embed
    ? `${getSiteUrl()}/embed/book`
    : `${getSiteUrl()}/book`;
  const search = new URLSearchParams();

  if (params.partner) search.set("partner", params.partner);
  if (params.checkIn) search.set("checkIn", params.checkIn);
  if (params.checkOut) search.set("checkOut", params.checkOut);
  if (params.guests) search.set("guests", String(params.guests));
  if (params.room) search.set("room", params.room);

  const query = search.toString();
  return query ? `${base}?${query}` : base;
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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
