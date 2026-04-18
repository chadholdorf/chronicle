"use client";

import type { Feed } from "@/db/schema";

interface FeedListProps {
  feeds: Feed[];
  selectedFeedId: string | null;
  onSelectFeed: (feedId: string | null) => void;
  onSelectStarred: () => void;
  isStarredSelected: boolean;
  onAddFeed: () => void;
  onRefreshAll: () => void;
  onDailyDigest: () => void;
  isRefreshing: boolean;
  lastDigestAt: Date | null;
}

export default function FeedList({
  feeds,
  selectedFeedId,
  onSelectFeed,
  onSelectStarred,
  isStarredSelected,
  onAddFeed,
  onRefreshAll,
  onDailyDigest,
  isRefreshing,
  lastDigestAt,
}: FeedListProps) {
  const totalUnread = feeds.reduce((sum, f) => sum + f.unreadCount, 0);

  function formatLastDigest(date: Date): string {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    return "Yesterday";
  }

  const isAllSelected = !selectedFeedId && !isStarredSelected;

  return (
    <aside className="w-60 flex-shrink-0 bg-[--bg-secondary] border-r border-[--border] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-[--border]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[--accent] rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[--text-primary] leading-tight">Chronicle</h1>
            <p className="text-[10px] text-[--text-muted] leading-tight">RSS, restored.</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="px-2 pt-2 space-y-0.5">
        <button
          onClick={() => onSelectFeed(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            isAllSelected
              ? "bg-[--accent-light] text-[--accent] font-medium"
              : "text-[--text-secondary] hover:bg-[--bg-tertiary]"
          }`}
        >
          <span>All Items</span>
          {totalUnread > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              isAllSelected ? "bg-[--accent] text-white" : "bg-[--accent] text-white"
            }`}>
              {totalUnread}
            </span>
          )}
        </button>

        <button
          onClick={onSelectStarred}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            isStarredSelected
              ? "bg-[--accent-light] text-[--accent] font-medium"
              : "text-[--text-secondary] hover:bg-[--bg-tertiary]"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
          <span>Starred</span>
        </button>
      </nav>

      {/* Add Feed */}
      <div className="px-2 pt-3">
        <button
          onClick={onAddFeed}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[--accent] hover:bg-[--accent-light] transition-colors font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Add Feed
        </button>
      </div>

      {/* Feeds list */}
      <div className="flex-1 overflow-y-auto mt-3 px-2 space-y-0.5 min-h-0">
        {feeds.length > 0 && (
          <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-[--text-muted]">
            Subscriptions
          </p>
        )}
        {feeds.map((feed) => (
          <button
            key={feed.id}
            onClick={() => onSelectFeed(feed.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors group ${
              selectedFeedId === feed.id
                ? "bg-[--accent-light] text-[--accent] font-medium"
                : "text-[--text-secondary] hover:bg-[--bg-tertiary]"
            }`}
          >
            {/* Favicon */}
            <div className="flex-shrink-0 w-5 h-5 rounded overflow-hidden">
              {feed.faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={feed.faviconUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = "none";
                    const next = el.nextElementSibling as HTMLElement | null;
                    if (next) next.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center bg-[--bg-tertiary] text-[--text-secondary] ${feed.faviconUrl ? "hidden" : "flex"}`}
              >
                {feed.title.charAt(0).toUpperCase()}
              </div>
            </div>

            <span className="flex-1 text-left truncate text-xs">{feed.title}</span>

            {feed.unreadCount > 0 && (
              <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-[--accent] text-white font-medium">
                {feed.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-[--border] space-y-1">
        <button
          onClick={onDailyDigest}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[--text-secondary] hover:bg-[--bg-tertiary] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <div className="flex-1 text-left">
            <div className="text-xs font-medium">Daily Digest</div>
            {lastDigestAt && (
              <div className="text-[10px] text-[--text-muted]">
                {formatLastDigest(lastDigestAt)}
              </div>
            )}
          </div>
        </button>

        <button
          onClick={onRefreshAll}
          disabled={isRefreshing}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[--text-secondary] hover:bg-[--bg-tertiary] transition-colors disabled:opacity-60"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={isRefreshing ? "animate-spin" : ""}
          >
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span className="text-xs">{isRefreshing ? "Refreshing…" : "Refresh All"}</span>
        </button>
      </div>
    </aside>
  );
}
