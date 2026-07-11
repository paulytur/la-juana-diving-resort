import { prisma } from "./db";

export const PAYMENT_SETTING_KEYS = {
  qrImageUrl: "payment_qr_image_url",
  accountName: "payment_account_name",
  accountNumber: "payment_account_number",
  instructions: "payment_instructions",
} as const;

export type PaymentSettings = {
  qrImageUrl: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
};

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  qrImageUrl: "",
  accountName: "",
  accountNumber: "",
  instructions:
    "Scan the QR code with your GCash or Maya app, pay the downpayment, then upload your receipt below.",
};

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(PAYMENT_SETTING_KEYS) } },
  });

  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    qrImageUrl: map.get(PAYMENT_SETTING_KEYS.qrImageUrl) ?? DEFAULT_PAYMENT_SETTINGS.qrImageUrl,
    accountName: map.get(PAYMENT_SETTING_KEYS.accountName) ?? DEFAULT_PAYMENT_SETTINGS.accountName,
    accountNumber:
      map.get(PAYMENT_SETTING_KEYS.accountNumber) ?? DEFAULT_PAYMENT_SETTINGS.accountNumber,
    instructions:
      map.get(PAYMENT_SETTING_KEYS.instructions) ?? DEFAULT_PAYMENT_SETTINGS.instructions,
  };
}

export async function savePaymentSettings(settings: PaymentSettings) {
  const entries: [string, string][] = [
    [PAYMENT_SETTING_KEYS.qrImageUrl, settings.qrImageUrl],
    [PAYMENT_SETTING_KEYS.accountName, settings.accountName],
    [PAYMENT_SETTING_KEYS.accountNumber, settings.accountNumber],
    [PAYMENT_SETTING_KEYS.instructions, settings.instructions],
  ];

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );
}
