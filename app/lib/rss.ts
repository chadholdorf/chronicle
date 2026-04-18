import Parser from "rss-parser";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import { feeds, items } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { Feed, NewItem } from "@/db/schema";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Chronicle RSS Reader/1.0",
  },
});

export async function fetchAndParseFeed(url: string) {
  const feed = await parser.parseURL(url);
  return feed;
}

export async function addFeed(url: string): Promise<Feed> {
  const parsed = await fetchAndParseFeed(url);

  const feedId = uuidv4();
  const faviconUrl = getFaviconUrl(parsed.link ?? url);

  const [feed] = await db
    .insert(feeds)
    .values({
      id: feedId,
      url,
      title: parsed.title ?? url,
      description: parsed.description ?? "",
      faviconUrl,
      lastFetchedAt: new Date(),
    })
    .returning();

  const newItems = buildItems(feedId, parsed.items ?? []);
  if (newItems.length > 0) {
    await db.insert(items).values(newItems).onConflictDoNothing();
  }

  await syncFeedCounts(feedId);

  return feed;
}

export async function refreshFeed(feedId: string, url: string): Promise<number> {
  let parsed;
  try {
    parsed = await fetchAndParseFeed(url);
  } catch {
    return 0;
  }

  const newItems = buildItems(feedId, parsed.items ?? []);
  let inserted = 0;

  if (newItems.length > 0) {
    const result = await db
      .insert(items)
      .values(newItems)
      .onConflictDoNothing();
    inserted = (result as { rowsAffected?: number; changes?: number }).rowsAffected ?? (result as { changes?: number }).changes ?? 0;
  }

  await db
    .update(feeds)
    .set({ lastFetchedAt: new Date() })
    .where(eq(feeds.id, feedId));

  await syncFeedCounts(feedId);

  return inserted;
}

function buildItems(
  feedId: string,
  parsedItems: Parser.Item[]
): NewItem[] {
  return parsedItems.slice(0, 50).map((item) => ({
    id: uuidv4(),
    feedId,
    title: item.title ?? "Untitled",
    url: item.link ?? item.guid ?? `${feedId}-${Date.now()}`,
    content: item.content ?? (item as Record<string, unknown>)["content:encoded"] as string | undefined ?? item.contentSnippet ?? null,
    author: item.creator ?? (item as Record<string, unknown>)["author"] as string | undefined ?? null,
    publishedAt: item.pubDate ? new Date(item.pubDate) : item.isoDate ? new Date(item.isoDate) : new Date(),
    isRead: false,
    isStarred: false,
  }));
}

async function syncFeedCounts(feedId: string) {
  const [counts] = await db
    .select({
      total: sql<number>`count(*)`,
      unread: sql<number>`sum(case when is_read = 0 then 1 else 0 end)`,
    })
    .from(items)
    .where(eq(items.feedId, feedId));

  await db
    .update(feeds)
    .set({
      itemCount: counts.total ?? 0,
      unreadCount: counts.unread ?? 0,
    })
    .where(eq(feeds.id, feedId));
}

function getFaviconUrl(siteUrl: string): string {
  try {
    const url = new URL(siteUrl);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
  } catch {
    return "";
  }
}
