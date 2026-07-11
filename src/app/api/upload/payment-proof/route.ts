import { NextResponse } from "next/server";
import { saveUploadedImage } from "@/lib/upload";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const imageUrl = await saveUploadedImage(file, "payments");
    return NextResponse.json({ imageUrl });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
