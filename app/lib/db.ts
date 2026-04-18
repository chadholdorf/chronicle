import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";

const isLocal = !process.env.TURSO_DATABASE_URL;

const client = createClient(
  isLocal
    ? { url: "file:chronicle.db" }
    : {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
);

let _initialized = false;

async function initSchema() {
  if (_initialized) return;
  _initialized = true;

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS feeds (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      favicon_url TEXT,
      last_fetched_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      item_count INTEGER NOT NULL DEFAULT 0,
      unread_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      content TEXT,
      summary TEXT,
      author TEXT,
      published_at INTEGER,
      fetched_at INTEGER NOT NULL DEFAULT (unixepoch()),
      is_read INTEGER NOT NULL DEFAULT 0,
      is_starred INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS digests (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      item_count INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS items_feed_id_idx ON items(feed_id);
    CREATE INDEX IF NOT EXISTS items_published_at_idx ON items(published_at DESC);
    CREATE INDEX IF NOT EXISTS items_is_read_idx ON items(is_read);
    CREATE INDEX IF NOT EXISTS items_is_starred_idx ON items(is_starred);
  `);
}

export const db = drizzle(client, { schema });

// Call initSchema on first import — safe to call multiple times
initSchema().catch((err) => console.error("Schema init failed:", err));
