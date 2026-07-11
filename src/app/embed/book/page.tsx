import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy embed booking URL — guests book on La Juana directly (no iframe). */
export default function EmbedBookRedirect() {
  redirect("/book");
}
