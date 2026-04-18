import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { feeds } from "@/db/schema";
import { addFeed } from "@/app/lib/rss";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allFeeds = await db.select().from(feeds).orderBy(desc(feeds.createdAt));
    return NextResponse.json(allFeeds);
  } catch (err) {
    console.error("GET /api/feeds error:", err);
    return NextResponse.json({ error: "Failed to fetch feeds" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json() as { url: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const normalizedUrl = url.trim();

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "URL must use http or https" }, { status: 400 });
    }

    const feed = await addFeed(normalizedUrl);
    return NextResponse.json(feed, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add feed";
    const isRssError = message.includes("not a feed") || message.includes("Invalid") || message.includes("parse");
    return NextResponse.json(
      { error: isRssError ? "Could not parse RSS feed. Make sure the URL points to a valid RSS/Atom feed." : message },
      { status: isRssError ? 422 : 500 }
    );
  }
}
