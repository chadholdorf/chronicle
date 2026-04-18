import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/app/lib/db";
import { items, feeds } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const { feedId } = await request.json() as { feedId?: string };

    const condition = feedId ? and(eq(items.feedId, feedId), eq(items.isRead, false)) : eq(items.isRead, false);

    await db.update(items).set({ isRead: true }).where(condition);

    if (feedId) {
      await db.update(feeds).set({ unreadCount: 0 }).where(eq(feeds.id, feedId));
    } else {
      await db.update(feeds).set({ unreadCount: 0 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/items/mark-read error:", err);
    return NextResponse.json({ error: "Failed to mark items as read" }, { status: 500 });
  }
}
