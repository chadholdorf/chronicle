import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/app/lib/db";
import { feeds } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchema();
    await db.delete(feeds).where(eq(feeds.id, params.id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/feeds/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete feed" }, { status: 500 });
  }
}
