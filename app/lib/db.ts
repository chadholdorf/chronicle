import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";
import path from "path";

const DB_PATH = path.join(process.cwd(), "chronicle.db");

let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    _db = drizzle(sqlite, { schema });
    initSchema(sqlite);
  }
  return _db;
}

function initSchema(sqlite: Database.Database) {
  sqlite.exec(`
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

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  },
});
