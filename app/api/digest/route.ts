import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { items, feeds, digests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateDailyDigest } from "@/app/lib/claude";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const [latest] = await db
      .select()
      .from(digests)
      .orderBy(desc(digests.createdAt))
      .limit(1);

    return NextResponse.json({ latest: latest ?? null });
  } catch (err) {
    console.error("GET /api/digest error:", err);
    return NextResponse.json({ error: "Failed to fetch digest" }, { status: 500 });
  }
}

export async function POST() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const recentItems = await db
      .select({
        id: items.id,
        title: items.title,
        content: items.content,
        summary: items.summary,
        feedTitle: feeds.title,
      })
      .from(items)
      .leftJoin(feeds, eq(items.feedId, feeds.id))
      .where(eq(items.isRead, false))
      .orderBy(desc(items.publishedAt))
      .limit(20);

    if (recentItems.length === 0) {
      return NextResponse.json(
        { error: "No unread items to digest" },
        { status: 422 }
      );
    }

    const digestItems = recentItems.map((item) => ({
      title: item.title,
      feedTitle: item.feedTitle ?? "Unknown Feed",
      contentSnippet: item.summary ?? (item.content ?? "").slice(0, 200),
    }));

    const content = await generateDailyDigest(digestItems);

    const [digest] = await db
      .insert(digests)
      .values({
        id: uuidv4(),
        content,
        itemCount: recentItems.length,
      })
      .returning();

    return NextResponse.json(digest);
  } catch (err) {
    console.error("POST /api/digest error:", err);
    return NextResponse.json({ error: "Failed to generate digest" }, { status: 500 });
  }
}
