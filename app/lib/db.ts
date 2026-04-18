import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";

let _client: Client | null = null;
let _db: LibSQLDatabase<typeof schema> | null = null;
let _initialized = false;

function getClient(): Client {
  if (!_client) {
    const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
    _client = createClient(
      tursoUrl
        ? { url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN?.trim() }
        : { url: "file:chronicle.db" }
    );
  }
  return _client;
}

function getDb(): LibSQLDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getClient(), { schema });
  }
  return _db;
}

async function ensureSchema() {
  if (_initialized) return;
  _initialized = true;

  await getClient().executeMultiple(`
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

// Lazy proxy — avoids creating the client during Next.js build/module collection phase
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_target, prop) {
    const realDb = getDb();
    const value = realDb[prop as keyof typeof realDb];
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  },
});

// Exported so API routes can call it before queries
export { ensureSchema };
