import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase connection string to .env — see docs/SUPABASE.md.",
    );
  }

  if (
    connectionString.startsWith("file:") ||
    !connectionString.startsWith("postgres")
  ) {
    throw new Error(
      "DATABASE_URL must be a Supabase PostgreSQL URL (postgresql://...). " +
        "Get it from Supabase Dashboard → Project Settings → Database → Connection string.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
