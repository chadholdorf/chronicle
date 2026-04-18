import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const feeds = sqliteTable("feeds", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  faviconUrl: text("favicon_url"),
  lastFetchedAt: integer("last_fetched_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  itemCount: integer("item_count").notNull().default(0),
  unreadCount: integer("unread_count").notNull().default(0),
}, (t) => ({
  urlIdx: uniqueIndex("feeds_url_idx").on(t.url),
}));

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  feedId: text("feed_id")
    .notNull()
    .references(() => feeds.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  content: text("content"),
  summary: text("summary"),
  author: text("author"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  fetchedAt: integer("fetched_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  isStarred: integer("is_starred", { mode: "boolean" }).notNull().default(false),
}, (t) => ({
  urlIdx: uniqueIndex("items_url_idx").on(t.url),
}));

export const digests = sqliteTable("digests", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  itemCount: integer("item_count").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Digest = typeof digests.$inferSelect;
export type NewDigest = typeof digests.$inferInsert;
