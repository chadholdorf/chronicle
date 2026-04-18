import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/app/lib/db";
import { items, feeds } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchema();
    const body = await request.json() as {
      isRead?: boolean;
      isStarred?: boolean;
    };

    const updates: Partial<typeof items.$inferInsert> = {};
    if (body.isRead !== undefined) updates.isRead = body.isRead;
    if (body.isStarred !== undefined) updates.isStarred = body.isStarred;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const [item] = await db
      .update(items)
      .set(updates)
      .where(eq(items.id, params.id))
      .returning();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Update feed unread count when read status changes
    if (body.isRead !== undefined) {
      await syncFeedUnreadCount(item.feedId);
    }

    return NextResponse.json(item);
  } catch (err) {
    console.error("PATCH /api/items/[id] error:", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

async function syncFeedUnreadCount(feedId: string) {
  const [counts] = await db
    .select({
      unread: sql<number>`sum(case when is_read = 0 then 1 else 0 end)`,
    })
    .from(items)
    .where(eq(items.feedId, feedId));

  await db
    .update(feeds)
    .set({ unreadCount: counts.unread ?? 0 })
    .where(eq(feeds.id, feedId));
}
