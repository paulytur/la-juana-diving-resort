import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/upload";

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (
      folder !== "rooms" &&
      folder !== "facilities" &&
      folder !== "settings"
    ) {
      return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
    }

    const imageUrl = await saveUploadedImage(
      file,
      folder as "rooms" | "facilities" | "settings",
    );
    return NextResponse.json({ imageUrl });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
