import { format } from "date-fns";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Booking, RoomType } from "@/generated/prisma/client";
import { RESORT } from "@/lib/constants";
import { formatDateRange, formatPHP } from "@/lib/pricing";

export type BookingForInvoice = Booking & { roomType: RoomType };

const BRAND = rgb(26 / 255, 66 / 255, 196 / 255);
const INK = rgb(26 / 255, 46 / 255, 94 / 255);
const MUTED = rgb(107 / 255, 122 / 255, 153 / 255);
const LINE = rgb(232 / 255, 236 / 255, 244 / 255);

function drawLine(
  page: ReturnType<PDFDocument["getPages"]>[number],
  x1: number,
  y: number,
  x2: number,
) {
  page.drawLine({
    start: { x: x1, y },
    end: { x: x2, y },
    thickness: 1,
    color: LINE,
  });
}

export async function generateInvoicePdf(
  booking: BookingForInvoice,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  const contentWidth = width - margin * 2;

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = height - margin;

  page.drawText(RESORT.name, {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: BRAND,
  });
  y -= 22;

  page.drawText("BOOKING INVOICE", {
    x: margin,
    y,
    size: 11,
    font: fontBold,
    color: MUTED,
  });

  page.drawText(format(new Date(), "MMM d, yyyy"), {
    x: width - margin - fontRegular.widthOfTextAtSize(format(new Date(), "MMM d, yyyy"), 10),
    y: height - margin - 4,
    size: 10,
    font: fontRegular,
    color: MUTED,
  });

  y -= 28;
  page.drawText(RESORT.address, {
    x: margin,
    y,
    size: 9,
    font: fontRegular,
    color: MUTED,
  });
  y -= 14;
  page.drawText(`${RESORT.phone} · ${RESORT.email}`, {
    x: margin,
    y,
    size: 9,
    font: fontRegular,
    color: MUTED,
  });

  y -= 32;
  drawLine(page, margin, y, width - margin);
  y -= 24;

  const metaLeft = [
    ["Invoice no.", booking.reference],
    ["Status", "Confirmed"],
    ["Check-in", format(booking.checkIn, "MMM d, yyyy")],
  ] as const;
  const metaRight = [
    ["Booking date", format(booking.createdAt, "MMM d, yyyy")],
    ["Check-out", format(booking.checkOut, "MMM d, yyyy")],
    ["Nights", String(booking.nights)],
  ] as const;

  for (let i = 0; i < metaLeft.length; i++) {
    const rowY = y - i * 16;
    page.drawText(metaLeft[i][0], {
      x: margin,
      y: rowY,
      size: 9,
      font: fontRegular,
      color: MUTED,
    });
    page.drawText(metaLeft[i][1], {
      x: margin + 90,
      y: rowY,
      size: 9,
      font: fontBold,
      color: INK,
    });
    page.drawText(metaRight[i][0], {
      x: width / 2,
      y: rowY,
      size: 9,
      font: fontRegular,
      color: MUTED,
    });
    page.drawText(metaRight[i][1], {
      x: width / 2 + 90,
      y: rowY,
      size: 9,
      font: fontBold,
      color: INK,
    });
  }

  y -= 72;
  page.drawText("Bill to", {
    x: margin,
    y,
    size: 10,
    font: fontBold,
    color: BRAND,
  });
  y -= 18;
  page.drawText(booking.guestName, {
    x: margin,
    y,
    size: 11,
    font: fontBold,
    color: INK,
  });
  y -= 16;
  page.drawText(booking.guestEmail, {
    x: margin,
    y,
    size: 10,
    font: fontRegular,
    color: INK,
  });
  y -= 14;
  page.drawText(booking.guestPhone, {
    x: margin,
    y,
    size: 10,
    font: fontRegular,
    color: INK,
  });

  y -= 36;
  drawLine(page, margin, y, width - margin);
  y -= 22;

  const colDesc = margin;
  const colQty = width - margin - 180;
  const colAmount = width - margin - 70;

  page.drawText("Description", {
    x: colDesc,
    y,
    size: 9,
    font: fontBold,
    color: MUTED,
  });
  page.drawText("Qty", {
    x: colQty,
    y,
    size: 9,
    font: fontBold,
    color: MUTED,
  });
  page.drawText("Amount", {
    x: colAmount,
    y,
    size: 9,
    font: fontBold,
    color: MUTED,
  });

  y -= 8;
  drawLine(page, margin, y, width - margin);
  y -= 18;

  const roomLabel = booking.roomType.pricePerPerson
    ? `${booking.roomType.name} (${formatPHP(booking.roomType.pricePerNight)}/pax/night)`
    : `${booking.roomType.name} (${formatPHP(booking.roomType.pricePerNight)}/night)`;

  const lineItems: { label: string; qty: string; amount: number }[] = [
    {
      label: `${roomLabel}\n${formatDateRange(booking.checkIn, booking.checkOut)} · ${booking.guests} guest${booking.guests === 1 ? "" : "s"}`,
      qty: booking.roomType.pricePerPerson
        ? `${booking.guests} × ${booking.nights}n`
        : `${booking.nights} night${booking.nights === 1 ? "" : "s"}`,
      amount: booking.subtotal,
    },
  ];

  if (booking.petFee > 0) {
    lineItems.push({
      label: `Pet fee (${booking.pets} pet${booking.pets === 1 ? "" : "s"})`,
      qty: String(booking.pets),
      amount: booking.petFee,
    });
  }

  if (booking.dayTourFee > 0) {
    lineItems.push({
      label: `Day tour guests`,
      qty: String(booking.dayTourGuests),
      amount: booking.dayTourFee,
    });
  }

  for (const item of lineItems) {
    const lines = item.label.split("\n");
    page.drawText(lines[0], {
      x: colDesc,
      y,
      size: 10,
      font: fontBold,
      color: INK,
    });
    if (lines[1]) {
      page.drawText(lines[1], {
        x: colDesc,
        y: y - 13,
        size: 8,
        font: fontRegular,
        color: MUTED,
      });
    }
    page.drawText(item.qty, {
      x: colQty,
      y,
      size: 10,
      font: fontRegular,
      color: INK,
    });
    const amountText = formatPHP(item.amount);
    page.drawText(amountText, {
      x: colAmount,
      y,
      size: 10,
      font: fontRegular,
      color: INK,
    });
    y -= lines[1] ? 36 : 24;
  }

  y -= 8;
  drawLine(page, margin, y, width - margin);
  y -= 22;

  const totals: [string, string, boolean][] = [
    ["Subtotal", formatPHP(booking.subtotal + booking.petFee + booking.dayTourFee), false],
    ["Total", formatPHP(booking.totalAmount), true],
    ["Downpayment paid (50%)", formatPHP(booking.depositAmount), false],
    [
      "Balance due on arrival",
      formatPHP(booking.totalAmount - booking.depositAmount),
      true,
    ],
  ];

  for (const [label, value, bold] of totals) {
    page.drawText(label, {
      x: width - margin - 200,
      y,
      size: bold ? 11 : 10,
      font: bold ? fontBold : fontRegular,
      color: bold ? BRAND : INK,
    });
    const valueWidth = (bold ? fontBold : fontRegular).widthOfTextAtSize(
      value,
      bold ? 11 : 10,
    );
    page.drawText(value, {
      x: width - margin - valueWidth,
      y,
      size: bold ? 11 : 10,
      font: bold ? fontBold : fontRegular,
      color: bold ? BRAND : INK,
    });
    y -= bold ? 20 : 16;
  }

  if (booking.paymentReference) {
    y -= 8;
    page.drawText(`Payment reference: ${booking.paymentReference}`, {
      x: margin,
      y,
      size: 9,
      font: fontRegular,
      color: MUTED,
    });
  }

  if (booking.specialRequests) {
    y -= 28;
    page.drawText("Special requests", {
      x: margin,
      y,
      size: 9,
      font: fontBold,
      color: BRAND,
    });
    y -= 14;
    const maxWidth = contentWidth;
    const words = booking.specialRequests.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (fontRegular.widthOfTextAtSize(test, 9) > maxWidth) {
        page.drawText(line, {
          x: margin,
          y,
          size: 9,
          font: fontRegular,
          color: INK,
        });
        y -= 12;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, {
        x: margin,
        y,
        size: 9,
        font: fontRegular,
        color: INK,
      });
    }
  }

  y = margin + 40;
  drawLine(page, margin, y + 20, width - margin);
  page.drawText(
    "Thank you for choosing La Juana Diving Resort. We look forward to welcoming you!",
    {
      x: margin,
      y,
      size: 9,
      font: fontRegular,
      color: MUTED,
    },
  );

  return pdf.save();
}
