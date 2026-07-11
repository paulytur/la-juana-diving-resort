import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adminLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: parsed.data.email },
    });
    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.data.password, admin.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createAdminSession({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
