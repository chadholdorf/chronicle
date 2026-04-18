import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { feeds } from "@/db/schema";
import { refreshFeed } from "@/app/lib/rss";
import { eq, or, lt, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

const STALE_THRESHOLD_MINUTES = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { feedId?: string; force?: boolean };

    let feedsToRefresh;

    if (body.feedId) {
      feedsToRefresh = await db
        .select()
        .from(feeds)
        .where(eq(feeds.id, body.feedId));
    } else {
      const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);

      if (body.force) {
        feedsToRefresh = await db.select().from(feeds);
      } else {
        feedsToRefresh = await db
          .select()
          .from(feeds)
          .where(
            or(
              isNull(feeds.lastFetchedAt),
              lt(feeds.lastFetchedAt, staleThreshold)
            )
          );
      }
    }

    const results = await Promise.allSettled(
      feedsToRefresh.map((feed) => refreshFeed(feed.id, feed.url))
    );

    const newItemsCount = results.reduce((sum, r) => {
      return sum + (r.status === "fulfilled" ? r.value : 0);
    }, 0);

    return NextResponse.json({
      refreshed: feedsToRefresh.length,
      newItems: newItemsCount,
    });
  } catch (err) {
    console.error("POST /api/refresh error:", err);
    return NextResponse.json({ error: "Failed to refresh feeds" }, { status: 500 });
  }
}
