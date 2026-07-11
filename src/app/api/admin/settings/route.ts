import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getPaymentSettings, savePaymentSettings } from "@/lib/settings";
import { paymentSettingsSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdminSession();
    const settings = await getPaymentSettings();
    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
    const body = await request.json();
    const parsed = paymentSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 },
      );
    }

    await savePaymentSettings(parsed.data);
    return NextResponse.json(parsed.data);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
