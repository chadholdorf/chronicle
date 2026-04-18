import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { items, feeds } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get("feedId");
    const starred = searchParams.get("starred") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200);

    const conditions = [];
    if (feedId) conditions.push(eq(items.feedId, feedId));
    if (starred) conditions.push(eq(items.isStarred, true));

    const rows = await db
      .select({
        id: items.id,
        feedId: items.feedId,
        title: items.title,
        url: items.url,
        content: items.content,
        summary: items.summary,
        author: items.author,
        publishedAt: items.publishedAt,
        fetchedAt: items.fetchedAt,
        isRead: items.isRead,
        isStarred: items.isStarred,
        feedTitle: feeds.title,
        feedFaviconUrl: feeds.faviconUrl,
      })
      .from(items)
      .leftJoin(feeds, eq(items.feedId, feeds.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(items.publishedAt))
      .limit(limit);

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/items error:", err);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
