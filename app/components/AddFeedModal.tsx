"use client";

import { useState } from "react";
import type { Feed } from "@/db/schema";

interface AddFeedModalProps {
  onClose: () => void;
  onFeedAdded: (feed: Feed) => void;
}

const STARTER_FEEDS = [
  { label: "Hacker News", url: "https://news.ycombinator.com/rss" },
  { label: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { label: "Daring Fireball", url: "https://daringfireball.net/feeds/main" },
  { label: "Paul Graham Essays", url: "http://www.paulgraham.com/rss.html" },
  { label: "Benedict Evans", url: "https://www.ben-evans.com/benedictevans/rss.atom" },
];

export default function AddFeedModal({ onClose, onFeedAdded }: AddFeedModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json() as Feed & { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to add feed");
        return;
      }

      onFeedAdded(data);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleStarterClick(starterUrl: string) {
    setUrl(starterUrl);
    setError(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-[--border]">
          <h2 className="text-lg font-semibold text-[--text-primary]">Add RSS Feed</h2>
          <p className="text-sm text-[--text-secondary] mt-1">
            Paste an RSS or Atom feed URL to subscribe
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://example.com/feed.xml"
              className="w-full px-3 py-2.5 rounded-lg border border-[--border] text-sm text-[--text-primary] placeholder:text-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--accent] focus:border-transparent transition-shadow"
              autoFocus
              disabled={loading}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-[--text-muted] uppercase tracking-wide mb-2">
              Popular feeds to try
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_FEEDS.map((feed) => (
                <button
                  key={feed.url}
                  type="button"
                  onClick={() => handleStarterClick(feed.url)}
                  className="text-xs px-2.5 py-1 rounded-full border border-[--border] text-[--text-secondary] hover:border-[--accent] hover:text-[--accent] transition-colors"
                >
                  {feed.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-[--text-secondary] rounded-lg border border-[--border] hover:bg-[--bg-secondary] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[--accent] rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Fetching feed…
                </>
              ) : (
                "Add Feed"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
